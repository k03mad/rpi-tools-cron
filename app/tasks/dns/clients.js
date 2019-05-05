'use strict';

const {influx} = require('utils-mad');
const {sendPiholeRequest} = require('../../lib/api');

module.exports = async () => {
    const SEND_ITEMS = 30;

    const body = await sendPiholeRequest({topClients: SEND_ITEMS});

    const values = {};
    const topClients = Object.keys(body.top_sources);

    for (let i = 0; i < SEND_ITEMS; i++) {
        const client = topClients[i];

        if (client) {
            values[client] = body.top_sources[client];
        }
    }

    await influx.write({meas: 'dns-clients', values});
};
