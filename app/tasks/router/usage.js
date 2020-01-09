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
        ...monitorTraffic
    ] = await mikrotik.get([
        '/system/resource/print',
        '/interface/print',
        '/interface/wireless/registration-table/print',
        '/system/package/update/check-for-updates',
        '/ip/firewall/nat/print',
        ...['wan1', 'ether1', 'ether2', 'ether3', 'ether4', 'wlan1', 'wlan2']
            .map(elem => ['/interface/monitor-traffic', `=interface=${elem}`, '=once']),
    ]);

    const health = {
        mem: Number(usage['total-memory']) - Number(usage['free-memory']),
        cpu: Number(usage['cpu-load']),
        hdd: Number(usage['total-hdd-space']) - Number(usage['free-hdd-space']),
        uptime: usage.uptime,
    };

    const version = {
        updates: [
            updates['installed-version'],
            updates['latest-version'],
        ].join(' / '),
    };

    // signal-strength and data usage by wifi clients
    wifiClients.forEach(elem => {
        const dbm = elem['signal-strength'].replace(/@.+/, '');
        const trf = elem.bytes.replace(',', '.');
        const mac = elem['mac-address'];

        const [vendor] = oui(mac).split('\n')[0].match(/^(\w+( \w+)?)/);
        const key = `${vendor} [${mac}]`;

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

    firewallNat.forEach(elem => {
        if (elem.protocol) {
            let name = elem['dst-port'];

            for (const obj of firewallNat) {
                if (obj['dst-port'] === name && obj.comment) {
                    name += `: ${obj.comment}`;
                    break;
                }
            }

            if (natTraffic[name]) {
                natTraffic[name] += Number(elem.bytes);
            } else {
                natTraffic[name] = Number(elem.bytes);
            }
        }
    });

    await Promise.all([
        influx.append({meas: 'router-clients-traffic', values: clientsTraffic}),
        influx.append({meas: 'router-interface-traffic', values: interfaceTraffic}),
        influx.append({meas: 'router-nat-traffic', values: natTraffic}),
        influx.write({meas: 'router-clients-signal', values: clientsSignal}),
        influx.write({meas: 'router-interface-speed', values: interfaceSpeed}),
        influx.write({meas: 'router-updates', values: version}),
        influx.write({meas: 'router-usage', values: health}),
    ]);
};
