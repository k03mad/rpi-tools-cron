'use strict';

const {log} = require('utils-mad');
const {sendToInflux, sendPiholeRequest} = require('../../utils');

/**
 * Send pihole stats
 */
module.exports = async () => {
    try {
        const body = await sendPiholeRequest({summary: ''});
        const data = {};

        // eslint-disable-next-line prefer-const
        for (let [key, value] of Object.entries(body)) {
            if (typeof value === 'string') {
                value = Number(value.replace(',', '.'));
            }

            if (!isNaN(value)) {
                data[key] = value;
            }
        }

        if (data.domains_being_blocked !== 0) {
            await sendToInflux({meas: 'dns', tags: {pihole: 'stats'}, values: data});
        }
    } catch (err) {
        log.print(err);
    }
};
