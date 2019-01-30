'use strict';

const {log} = require('utils-mad');
const {sendToInflux, sendPiholeRequest} = require('../../utils');

/**
 * Send dns top hosts
 */
module.exports = async () => {
    const SEND_ITEMS = 15;

    try {
        const body = await sendPiholeRequest({topItems: SEND_ITEMS});

        const ads = {};
        const queries = {};

        const [topAds, topQueries] = [Object.keys(body.top_ads), Object.keys(body.top_queries)];

        for (let i = 0; i < SEND_ITEMS; i++) {
            const adElem = topAds[i];
            const queElem = topQueries[i];

            if (adElem) {
                ads[adElem] = body.top_ads[adElem];
            }

            if (queElem) {
                queries[queElem] = body.top_queries[queElem];
            }
        }

        await Promise.all([
            sendToInflux({meas: 'hosts', tags: {top: 'ads'}, values: ads}),
            sendToInflux({meas: 'hosts', tags: {top: 'queries'}, values: queries}),
        ]);
    } catch (err) {
        log.print(err);
    }
};
