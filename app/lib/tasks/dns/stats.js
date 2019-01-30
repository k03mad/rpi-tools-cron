'use strict';

const parseJson = require('json-parse-better-errors');
const {log, shell} = require('utils-mad');
const {sendToInflux} = require('../../utils');

/**
 * Send pihole stats
 */
const sendDnsQueries = async () => {
    try {
        const stat = await shell.run('pihole -c -j');
        const values = parseJson(stat);

        const domains = Number(values.domains_being_blocked);

        if (isNaN(domains) || domains === 0) {
            throw new Error(`Returned ${domains} domains in blacklist\n${stat}`);
        }

        await sendToInflux({meas: 'dns', tags: {pihole: 'stats'}, values});
    } catch (err) {
        log.print(err);
    }
};

module.exports = sendDnsQueries;
