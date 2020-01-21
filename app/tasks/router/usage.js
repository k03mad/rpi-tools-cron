'use strict';

const oui = require('oui');
const {influx, mikrotik} = require('utils-mad');

module.exports = async () => {
    const clientsSignal = {};
    const clientsTraffic = {};
    const interfaceTraffic = {};
    const interfaceSpeed = {};
    const natTraffic = {};

    const [
        [usage],
        interfaces,
        wifiClients,
        [, updates],
        firewallNat,
        dhcpLeases,
        ...monitorTraffic
    ] = await mikrotik.get([
        '/system/resource/print',
        '/interface/print',
        '/interface/wireless/registration-table/print',
        '/system/package/update/check-for-updates',
        '/ip/firewall/nat/print',
        '/ip/dhcp-server/lease/print',
        ...['wan1', 'ether1', 'ether2', 'ether3', 'ether4', 'wlan1', 'wlan2']
            .map(elem => ['/interface/monitor-traffic', `=interface=${elem}`, '=once']),
    ]);

    const health = {
        mem: Number(usage['total-memory']) - Number(usage['free-memory']),
        cpu: Number(usage['cpu-load']),
        hdd: Number(usage['total-hdd-space']) - Number(usage['free-hdd-space']),
        uptime: usage.uptime,
        updates: `current: ${updates['installed-version']}</br>latest: ${updates['latest-version']}`,
    };

    // signal-strength and data usage by wifi clients
    wifiClients.forEach(elem => {
        const dbm = elem['signal-strength'].replace(/@.+/, '');
        const trf = elem.bytes.replace(',', '.');
        const mac = elem['mac-address'];

        const [client] = dhcpLeases.filter(lease => lease['mac-address'] === mac);

        let key;

        if (client && client.comment) {
            key = client.comment;
        } else {
            const [vendor] = oui(mac).split('\n')[0].match(/^(\w+( \w+)?)/);
            key = `${vendor} [${mac}]`;
        }

        clientsSignal[key] = Number(dbm);
        clientsTraffic[key] = Number(trf);
    });

    interfaces.forEach(elem => {
        const {name} = elem;
        const rx = Number(elem['rx-byte']);
        const tx = Number(elem['tx-byte']);
        const sum = rx + tx;

        // data usage by ethernet clients, except WAN
        // to add to wifi clients data graph
        if (name.includes('ether') && sum > 0) {
            clientsTraffic[name] = sum;
        }

        if (name !== 'bridge') {
            interfaceTraffic[`${name}_rx`] = rx;
            interfaceTraffic[`${name}_tx`] = tx;
        }
    });

    monitorTraffic.forEach(([obj]) => {
        interfaceSpeed[`${obj.name}_rx`] = Number(obj['rx-bits-per-second']);
        interfaceSpeed[`${obj.name}_tx`] = Number(obj['tx-bits-per-second']);
    });

    firewallNat.forEach((elem, i) => {
        let name;

        for (let j = i; j <= i; i--) {
            const {comment, 'dst-port': port} = firewallNat[i];

            if (comment) {
                name = port
                    ? `${port} :: ${comment}`
                    : `noport :: ${comment}`;

                break;
            }
        }

        if (name && !name.includes('defconf')) {
            const REGEXP_IP = /((?:\d{1,3}\.){3}\d{1,3})/;
            const matchedIp = name.match(REGEXP_IP);

            if (matchedIp) {
                const [client] = dhcpLeases.filter(lease => lease.address === matchedIp[0]);

                if (client && client.comment) {
                    name = name.replace(REGEXP_IP, `${client.comment} :: $1`);
                }
            }

            name = name.replace(/(\d): /g, '$1 :: ');

            if (natTraffic[name]) {
                natTraffic[name] += Number(elem.bytes);
            } else {
                natTraffic[name] = Number(elem.bytes);
            }
        }
    });

    await influx.append([
        {meas: 'router-clients-traffic', values: clientsTraffic},
        {meas: 'router-interface-traffic', values: interfaceTraffic},
        {meas: 'router-nat-traffic', values: natTraffic},
    ]);

    await influx.write([
        {meas: 'router-clients-signal', values: clientsSignal},
        {meas: 'router-interface-speed', values: interfaceSpeed},
        {meas: 'router-usage', values: health},
    ]);
};
