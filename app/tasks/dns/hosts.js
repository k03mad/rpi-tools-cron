'use strict';

const {sendToInflux, sendPiholeRequest} = require('../../lib/utils');

/**
 * Send dns top hosts
 */
module.exports = async () => {
    const SEND_ITEMS = 15;

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
        sendToInflux({meas: 'dns-hosts', tags: {top: 'ads'}, values: ads}),
        sendToInflux({meas: 'dns-hosts', tags: {top: 'queries'}, values: queries}),
    ]);
};
