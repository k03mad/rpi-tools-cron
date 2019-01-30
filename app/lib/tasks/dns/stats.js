'use strict';

const {log} = require('utils-mad');
const {sendToInflux, sendPiholeRequest} = require('../../utils');

/**
 * Send pihole stats
 */
module.exports = async () => {
    try {
        const body = await sendPiholeRequest({summaryRaw: ''});
        const data = {};

        for (const key in body) {
            const prop = body[key];

            if (!isNaN(prop)) {
                data[key] = prop;
            }
        }

        console.log(data);

        if (data.domains_being_blocked !== 0) {
            await sendToInflux({meas: 'stats', values: data});
        }
    } catch (err) {
        log.print(err);
    }
};
