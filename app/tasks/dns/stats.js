'use strict';

const {influx, array, adg, ip, object} = require('utils-mad');

module.exports = async () => {
    const DOMAINS_COUNT = 100;

    const [
        {
            avg_processing_time,
            num_blocked_filtering,
            num_dns_queries,

            top_blocked_domains,
            top_queried_domains,
            top_clients,
        }, {
            clients,
        },
    ] = await Promise.all([
        adg.get('stats'),
        adg.get('clients'),
    ]);

    const clientsByIp = {};
    const clientsByName = {};

    await Promise.all(top_clients.map(async elem => {
        const [[address, count]] = Object.entries(elem);

        if (address.match(/^(127|192|10)\./)) {
            let found;

            for (const client of clients) {
                if (client.ids.includes(address)) {
                    clientsByIp[`${address} - ${client.name}`] = count;
                    object.count(clientsByName, client.name, count);

                    found = true;
                    break;
                }
            }

            if (!found) {
                clientsByIp[address] = count;

                if (address.startsWith('10.')) {
                    object.count(clientsByName, 'VPN', count);
                } else {
                    object.count(clientsByName, 'Unknown', count);
                }
            }
        } else {
            const lookup = await ip.lookup(address);
            const clientInfo = [
                lookup.ipName.replace(/(\d+-?){4}/, '{ip}'),
                lookup.city,
                lookup.countryCode,
                lookup.isp,
            ].filter(Boolean);

            const withIp = [address, ...clientInfo]
                .join(' - ');

            const withoutIp = clientInfo
                .join(' - ');

            clientsByIp[withIp] = count;
            object.count(clientsByName, withoutIp, count);
        }
    }));

    await influx.write([
        {meas: 'dns-stats-common', values: {avg_processing_time, num_blocked_filtering, num_dns_queries}},
        {meas: 'dns-stats-clients', values: clientsByIp},
        {meas: 'dns-stats-clients-name', values: clientsByName},
        {meas: 'dns-stats-domains-q', values: array.mergeobj(top_queried_domains.slice(0, DOMAINS_COUNT))},
        {meas: 'dns-stats-domains-b', values: array.mergeobj(top_blocked_domains.slice(0, DOMAINS_COUNT))},
    ]);

};
