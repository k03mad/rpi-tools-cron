'use strict';

const oui = require('oui');
const {influx, mikrotik} = require('utils-mad');

/** */
module.exports = async () => {
    const SEPARATOR = ' :: ';

    const clientsSignal = {};
    const clientsTraffic = {};
    const interfacesSpeed = {};
    const interfacesTraffic = {};
    const natTraffic = {};

    const [
        interfaces,
        firewallNat,
        dhcpLeases,
        wifiClients,
        [usage],
        [, updates],
    ] = await mikrotik.write([
        ['/interface/print'],
        ['/ip/firewall/nat/print'],
        ['/ip/dhcp-server/lease/print'],
        ['/interface/wireless/registration-table/print'],
        ['/system/resource/print'],
        ['/system/package/update/check-for-updates'],
    ]);

    const monitorTraffic = await mikrotik.write(
        interfaces.map(elem => ['/interface/monitor-traffic', `=interface=${elem.name}`, '=once']),
    );

    monitorTraffic.forEach(([obj]) => {
        interfacesSpeed[`${obj.name}_rx`] = Number(obj['rx-bits-per-second']);
        interfacesSpeed[`${obj.name}_tx`] = Number(obj['tx-bits-per-second']);
    });

    interfaces.forEach(elem => {
        interfacesTraffic[`${elem.name}_rx`] = Number(elem['rx-byte']);
        interfacesTraffic[`${elem.name}_tx`] = Number(elem['tx-byte']);

        const sum = Number(elem['rx-byte']) + Number(elem['tx-byte']);

        if (elem.name.includes('ether') && sum > 0) {
            clientsTraffic[elem.name] = sum;
        }
    });

    firewallNat.forEach((elem, i) => {
        let name;

        for (let j = i; j <= i; i--) {
            const {comment, 'dst-port': port} = firewallNat[i];

            if (comment) {
                name = port
                    ? port + SEPARATOR + comment
                    : `noport${SEPARATOR + comment}`;

                break;
            }
        }

        if (name && !name.includes('defconf')) {
            const REGEXP_IP = /((?:\d{1,3}\.){3}\d{1,3})/;
            const matchedIp = name.match(REGEXP_IP);

            if (matchedIp) {
                const [client] = dhcpLeases.filter(lease => lease.address === matchedIp[0]);

                if (client && client.comment) {
                    name = name.replace(REGEXP_IP, `${client.comment + SEPARATOR}$1`);
                }
            }

            name = name.replace(/(\d): /g, `$1${SEPARATOR}`);

            if (natTraffic[name]) {
                natTraffic[name] += Number(elem.bytes);
            } else {
                natTraffic[name] = Number(elem.bytes);
            }
        }
    });

    wifiClients.forEach(elem => {
        const mac = elem['mac-address'];
        const [client] = dhcpLeases.filter(lease => lease['mac-address'] === mac);

        let key;

        if (client && client.comment) {
            key = client.comment;
        } else {
            const [vendor] = oui(mac).split('\n')[0].match(/^(\w+( \w+)?)/);
            key = vendor + SEPARATOR + mac;
        }

        clientsTraffic[key] = Number(elem.bytes.replace(',', '.'));
        clientsSignal[key] = Number(elem['signal-strength'].replace(/@.+/, ''));
    });

    const health = {
        mem: Number(usage['total-memory']) - Number(usage['free-memory']),
        hdd: Number(usage['total-hdd-space']) - Number(usage['free-hdd-space']),
        cpu: Number(usage['cpu-load']),
        uptime: usage.uptime,
        updates: `current: ${updates['installed-version']}</br>latest: ${updates['latest-version']}`,
    };

    await influx.write([
        {meas: 'mikrotik-clients-signal', values: clientsSignal},
        {meas: 'mikrotik-interfaces-speed', values: interfacesSpeed},
        {meas: 'mikrotik-usage', values: health},
    ]);

    await influx.append([
        {meas: 'mikrotik-clients-traffic', values: clientsTraffic},
        {meas: 'mikrotik-interfaces-traffic', values: interfacesTraffic},
        {meas: 'mikrotik-nat-traffic', values: natTraffic},
    ]);
};
