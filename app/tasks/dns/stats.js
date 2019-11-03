'use strict';

const {influx, array} = require('utils-mad');
const {sendAdgRequest} = require('../../lib/api');

module.exports = async () => {
    const DOMAINS_COUNT = 15;

    const {
        avg_processing_time,
        num_blocked_filtering,
        num_dns_queries,

        top_blocked_domains,
        top_queried_domains,
        top_clients,
    } = await sendAdgRequest('stats');

    await Promise.all([
        influx.write({meas: 'dns-stats-common', values: {avg_processing_time, num_blocked_filtering, num_dns_queries}}),
        influx.write({meas: 'dns-stats-clients', values: array.mergeobj(top_clients)}),
        influx.write({meas: 'dns-stats-domains-q', values: array.mergeobj(top_queried_domains.slice(0, DOMAINS_COUNT))}),
        influx.write({meas: 'dns-stats-domains-b', values: array.mergeobj(top_blocked_domains.slice(0, DOMAINS_COUNT))}),
    ]);
};
