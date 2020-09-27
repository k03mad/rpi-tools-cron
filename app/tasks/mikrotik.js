'use strict';

const oui = require('oui');
const pMap = require('p-map');
const {influx, mikrotik, object, ip} = require('utils-mad');

/** */
module.exports = async () => {
    const SEPARATOR = ' :: ';

    const etherDevices = {
        ether1: 'Pi',
        ether2: 'XBoxLan',
        ether3: 'PhiTVLan',
    };

    const lookupConcurrency = 3;
    // 1 MB
    const connectionsMinBytes = 1048576;

    const clientsSignal = {};
    const clientsTraffic = {};
    const interfacesSpeed = {};
    const interfacesTraffic = {};
    const natTraffic = {};
    const connectionsDomains = {};

    const [
        interfaces,
        firewallNat,
        firewallConnections,
        dhcpLeases,
        wifiClients,
        [usage],
        [, updates],
        lists,
    ] = await mikrotik.write([
        ['/interface/print'],
        ['/ip/firewall/nat/print'],
        ['/ip/firewall/connection/print'],
        ['/ip/dhcp-server/lease/print'],
        ['/interface/wireless/registration-table/print'],
        ['/system/resource/print'],
        ['/system/package/update/check-for-updates'],
        ['/ip/firewall/address-list/print'],
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
            clientsTraffic[etherDevices[elem.name] || elem.name] = sum;
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
                const client = dhcpLeases.find(lease => lease.address === matchedIp[0]);

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
        const client = dhcpLeases.find(lease => lease['mac-address'] === mac);

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

    await pMap(firewallConnections, async elem => {
        const address = elem['dst-address'].replace(/:.+/, '');

        if (!ip.isLocal(address)) {
            const bytes = Number(elem['orig-bytes']) + Number(elem['repl-bytes']);

            if (bytes > connectionsMinBytes) {
                try {
                    const {hostname} = await ip.info(address);

                    if (hostname) {
                        const domain = hostname.split('.').slice(-2).join('.');
                        object.count(connectionsDomains, domain, bytes);
                    }
                } catch (err) {
                    if (err.response && err.response.statusCode === 429) {
                        return;
                    }

                    throw err;
                }
            }
        }
    }, {concurrency: lookupConcurrency});

    const addressLists = {};

    lists.forEach(elem => {
        object.count(addressLists, elem.list, 1);
    });

    const health = {
        mem: Number(usage['total-memory']) - Number(usage['free-memory']),
        hdd: Number(usage['total-hdd-space']) - Number(usage['free-hdd-space']),
        cpu: Number(usage['cpu-load']),
        uptime: `Uptime: ${usage.uptime}`,
        updates: `Version: ${updates['installed-version']}/${updates['latest-version']}`,
    };

    await influx.write([
        {meas: 'mikrotik-clients-signal', values: clientsSignal},
        {meas: 'mikrotik-interfaces-speed', values: interfacesSpeed},
        {meas: 'mikrotik-address-lists', values: addressLists},
        {meas: 'mikrotik-usage', values: health},
    ]);

    await influx.append([
        {meas: 'mikrotik-clients-traffic', values: clientsTraffic},
        {meas: 'mikrotik-connections-traffic', values: connectionsDomains},
        {meas: 'mikrotik-interfaces-traffic', values: interfacesTraffic},
        {meas: 'mikrotik-nat-traffic', values: natTraffic},
    ]);
};
