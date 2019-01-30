'use strict';

const {pihole} = require('../../../../env');
const {request, log} = require('utils-mad');
const {sendToInflux} = require('../../utils');

/**
 * Send dns top hosts
 */
const sendDnsTop = async () => {
    const SEND_ITEMS = 15;

    try {
        const {url, auth} = pihole;
        const {body} = await request.got(url, {
            query: {topItems: SEND_ITEMS, auth},
            json: true,
        });

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
            sendToInflux({meas: 'dns', tags: {pihole: 'ads'}, values: ads}),
            sendToInflux({meas: 'dns', tags: {pihole: 'queries'}, values: queries}),
        ]);
    } catch (err) {
        log.print(err);
    }
};

module.exports = sendDnsTop;
