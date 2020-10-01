'use strict';

const oui = require('oui');
const pMap = require('p-map');
const {influx, mikrotik, object, ip} = require('utils-mad');

/** */
module.exports = async () => {
    const SEPARATOR = ' :: ';

    const lookupConcurrency = 3;
    // 1 MB
    const connectionsMinBytes = 1048576;

    const clientsSignal = {};
    const clientsTraffic = {};
    const interfacesSpeed = {};
    const interfacesTraffic = {};
    const natTraffic = {};
    const filterTraffic = {};
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
        firewallFilter,
    ] = await mikrotik.write([
        ['/interface/print'],
        ['/ip/firewall/nat/print'],
        ['/ip/firewall/connection/print'],
        ['/ip/dhcp-server/lease/print'],
        ['/interface/wireless/registration-table/print'],
        ['/system/resource/print'],
        ['/system/package/update/check-for-updates'],
        ['/ip/firewall/address-list/print'],
        ['/ip/firewall/filter/print'],
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

    firewallNat.forEach(({comment, bytes}) => {
        if (comment) {
            if (natTraffic[comment]) {
                natTraffic[comment] += Number(bytes);
            } else {
                natTraffic[comment] = Number(bytes);
            }
        }
    });

    firewallFilter.forEach(({comment, bytes}) => {
        if (comment && !comment.includes('dummy rule')) {
            if (filterTraffic[comment]) {
                filterTraffic[comment] += Number(bytes);
            } else {
                filterTraffic[comment] = Number(bytes);
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
            const [vendor] = oui(mac).split('\n')[0].match(/^([\w-]+( \w+)?)/);
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
        uptime: usage.uptime,
        updates: `${updates['installed-version']}/${updates['latest-version']}`,
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
        {meas: 'mikrotik-filter-traffic', values: filterTraffic},
    ]);
};
