'use strict';

const {influx} = require('utils-mad');
const {sendPiholeRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendPiholeRequest({summaryRaw: ''});
    const values = {};

    for (const key in body) {
        const prop = body[key];

        if (!isNaN(prop)) {
            values[key] = prop;
        }
    }

    if (values.domains_being_blocked !== 0) {
        await influx.write({meas: 'dns-stats', values});
    }
};
