'use strict';

const {influx, array} = require('utils-mad');
const {sendAdgRequest, sendIpLookupRequest} = require('../../lib/api');

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
        sendAdgRequest('stats'),
        sendAdgRequest('clients'),
    ]);

    const clientsNamed = {};
    await Promise.all(top_clients.map(async elem => {
        const [[ip, count]] = Object.entries(elem);

        if (
            ip.startsWith('10.8.0.')
            || ip.startsWith('192.168.1.')
            || ip.startsWith('127.0.0.')
        ) {
            let found;

            for (const client of clients) {
                if (client.ids.includes(ip)) {
                    clientsNamed[`${ip} (${client.name})`] = count;
                    found = true;
                    break;
                }
            }

            if (!found) {
                clientsNamed[ip] = count;
            }
        } else {
            const {ipName, city, countryCode, isp} = await sendIpLookupRequest(ip);
            clientsNamed[`${ip} (${ipName} - ${city} ${countryCode} - ${isp})`] = count;
        }
    }));

    await Promise.all([
        influx.write({meas: 'dns-stats-common', values: {avg_processing_time, num_blocked_filtering, num_dns_queries}}),
        influx.write({meas: 'dns-stats-clients', values: clientsNamed}),

        influx.write({meas: 'dns-stats-domains-q', values: array.mergeobj(top_queried_domains.slice(0, DOMAINS_COUNT))}),
        influx.write({meas: 'dns-stats-domains-b', values: array.mergeobj(top_blocked_domains.slice(0, DOMAINS_COUNT))}),
    ]);
};
