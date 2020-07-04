'use strict';

const {influx, array, adg, ip, object} = require('utils-mad');

/** */
module.exports = async () => {
    const DOMAINS_COUNT = 20;
    const IP_SEPARATOR = ' :: ';

    const clientsInfo = {};
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

    // eslint-disable-next-line camelcase
    for (const elem of top_clients) {
        const [[address, count]] = Object.entries(elem);

        if (ip.isLocal(address)) {
            let found;

            for (const client of clients) {
                if (client.ids.includes(address)) {
                    clientsInfo[address + IP_SEPARATOR + client.name] = count;

                    found = true;
                    break;
                }
            }

            if (!found) {
                clientsInfo[address] = count;
            }
        } else {
            const lookup = await ip.lookup(address);
            const clientInfo = [
                lookup.countrycode,
                lookup.city,
                lookup.isp,
            ].filter(Boolean).join(IP_SEPARATOR);

            object.count(clientsInfo, clientInfo, count);
        }
    }

    await influx.write([
        {meas: 'adguard-clients', values: clientsInfo},
        {meas: 'adguard-domains-blocked', values: array.mergeCol(top_blocked_domains.slice(0, DOMAINS_COUNT))},
        {meas: 'adguard-domains-queried', values: array.mergeCol(top_queried_domains.slice(0, DOMAINS_COUNT))},
        {meas: 'adguard-lists', values: lists},
        {meas: 'adguard-stats', values: {avg_processing_time, num_blocked_filtering, num_dns_queries}},
    ]);
};
