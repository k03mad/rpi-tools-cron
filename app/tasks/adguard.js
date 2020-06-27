'use strict';

const {influx, array, adg, ip, object} = require('utils-mad');

/** */
module.exports = async () => {
    const DOMAINS_COUNT = 20;
    const IP_SEPARATOR = ' :: ';

    const internal = {};
    const external = {};
    const lists = {};

    const {
        avg_processing_time,
        num_blocked_filtering, num_dns_queries,
        top_blocked_domains, top_queried_domains, top_clients,
    } = await adg.get('stats');

    const {clients} = await adg.get('clients');
    const {filters, whitelist_filters: filtersWl} = await adg.get('filtering/status');

    [...filters, ...filtersWl].forEach(elem => {
        lists[elem.name] = elem.rules_count;
    });

    await Promise.all(top_clients.map(async elem => {
        const [[address, count]] = Object.entries(elem);

        if (address.match(/^(127|192|10)\./)) {
            let found;

            for (const client of clients) {
                if (client.ids.includes(address)) {
                    internal[address + IP_SEPARATOR + client.name] = count;

                    found = true;
                    break;
                }
            }

            if (!found) {
                internal[address] = count;
            }
        } else {
            const lookup = await ip.lookup(address);
            const clientInfo = [
                lookup.countrycode,
                lookup.city,
                lookup.isp,
            ].filter(Boolean).join(IP_SEPARATOR);

            object.count(external, clientInfo, count);
        }
    }));

    await influx.write([
        {meas: 'dns-block-lists', values: lists},
        {meas: 'dns-stats-clients-internal', values: internal},
        {meas: 'dns-stats-common', values: {avg_processing_time, num_blocked_filtering, num_dns_queries}},
        {meas: 'dns-stats-domains-b', values: array.mergeCol(top_blocked_domains.slice(0, DOMAINS_COUNT))},
        {meas: 'dns-stats-domains-q', values: array.mergeCol(top_queried_domains.slice(0, DOMAINS_COUNT))},
    ]);

    if (Object.keys(external).length > 0) {
        await influx.write({meas: 'dns-stats-clients-external', values: external});
    }
};
