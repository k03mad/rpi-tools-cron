'use strict';

const {log} = require('utils-mad');
const {sendToInflux, sendPiholeRequest} = require('../../utils');

/**
 * Send pihole stats
 */
module.exports = async () => {
    try {
        const body = await sendPiholeRequest();

        await sendToInflux({meas: 'dns', tags: {pihole: 'stats'}, values: body});
    } catch (err) {
        log.print(err);
    }
};
