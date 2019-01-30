'use strict';

const {pihole} = require('../../../../env');
const {request, log} = require('utils-mad');
const {sendToInflux} = require('../../utils');

/**
 * Send dns top clients
 */
const sendClientsTop = async () => {
    const SEND_ITEMS = 30;

    try {
        const {url, auth} = pihole;
        const {body} = await request.got(url, {
            query: {topClients: SEND_ITEMS, auth},
            json: true,
        });

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

module.exports = sendClientsTop;
