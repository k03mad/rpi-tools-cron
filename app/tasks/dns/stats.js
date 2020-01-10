'use strict';

const {influx, array, adg, ip} = require('utils-mad');

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

    const clientsNamed = {};
    await Promise.all(top_clients.map(async elem => {
        const [[address, count]] = Object.entries(elem);

        if (
            address.startsWith('10.8.0.')
            || address.startsWith('192.168.1.')
            || address.startsWith('127.0.0.')
        ) {
            let found;

            for (const client of clients) {
                if (client.ids.includes(address)) {
                    clientsNamed[`${address} - ${client.name}`] = count;
                    found = true;
                    break;
                }
            }

            if (!found) {
                clientsNamed[address] = count;
            }
        } else {
            const lookup = await ip.lookup(address);
            const name = [];

            if (lookup.addressName && !lookup.addressName.includes(address.replace(/\./g, '-'))) {
                name.push(lookup.addressName);
            }

            if (lookup.city && lookup.countryCode) {
                name.push(`${lookup.city} ${lookup.countryCode}`);
            } else if (lookup.city) {
                name.push(lookup.city);
            }

            if (lookup.isp) {
                name.push(lookup.isp);
            }

            clientsNamed[`${address} - ${name.join(' - ')}`] = count;
        }
    }));

    await Promise.all([
        influx.write({meas: 'dns-stats-common', values: {avg_processing_time, num_blocked_filtering, num_dns_queries}}),
        influx.write({meas: 'dns-stats-clients', values: clientsNamed}),

        influx.write({meas: 'dns-stats-domains-q', values: array.mergeobj(top_queried_domains.slice(0, DOMAINS_COUNT))}),
        influx.write({meas: 'dns-stats-domains-b', values: array.mergeobj(top_blocked_domains.slice(0, DOMAINS_COUNT))}),
    ]);
};
