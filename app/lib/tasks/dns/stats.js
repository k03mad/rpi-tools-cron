'use strict';

const {log} = require('utils-mad');
const {sendToInflux, sendPiholeRequest} = require('../../utils');

/**
 * Send pihole stats
 */
module.exports = async () => {
    try {
        const body = await sendPiholeRequest({summaryRaw: ''});
        const values = {};

        for (const key in body) {
            const prop = body[key];

            if (!isNaN(prop)) {
                values[key] = prop;
            }
        }

        if (values.domains_being_blocked !== 0) {
            await sendToInflux({meas: 'stats', values});
        }
    } catch (err) {
        log.print(err);
    }
};
