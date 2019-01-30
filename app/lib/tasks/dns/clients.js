'use strict';

const {log} = require('utils-mad');
const {sendToInflux, sendPiholeRequest} = require('../../utils');

/**
 * Send dns top clients
 */
module.exports = async () => {
    const SEND_ITEMS = 30;

    try {
        const body = await sendPiholeRequest({topClients: SEND_ITEMS});

        const values = {};
        const topClients = Object.keys(body.top_sources);

        for (let i = 0; i < SEND_ITEMS; i++) {
            const client = topClients[i];

            if (client) {
                values[client] = body.top_sources[client];
            }
        }

        await sendToInflux({meas: 'dns', tags: {pihole: 'clients'}, values});
    } catch (err) {
        log.print(err);
    }
};
