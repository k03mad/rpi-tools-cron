'use strict';

const oui = require('oui');
const pMap = require('p-map');
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
            if (natTraffic[name]) {
                natTraffic[name] += Number(elem.bytes);
            } else {
                natTraffic[name] = Number(elem.bytes);
            }
        }
    });

    const write = [
        {meas: 'router-clients-signal', values: clientsSignal},
        {meas: 'router-interface-speed', values: interfaceSpeed},
        {meas: 'router-updates', values: version},
        {meas: 'router-usage', values: health},
    ];

    await pMap(write, data => influx.write(data), {concurrency: 2});

    const append = [
        {meas: 'router-clients-traffic', values: clientsTraffic},
        {meas: 'router-interface-traffic', values: interfaceTraffic},
        {meas: 'router-nat-traffic', values: natTraffic},
    ];

    for (const data of append) {
        await influx.append(data);
    }
};
