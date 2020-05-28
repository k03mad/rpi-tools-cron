'use strict';

const {influx} = require('utils-mad');
const {sendLastFmRequest} = require('../../lib/api');

/** */
module.exports = async () => {
    const body = await sendLastFmRequest('user.gettopartists', {
        period: '1month',
        limit: 10,
    });

    const top = {};
    body.forEach(user => {
        const data = {};
        user.topartists.artist.forEach(artist => {
            data[artist.name] = Number(artist.playcount);
        });
        top[user.fmuser] = data;
    });

    for (const user of Object.keys(top)) {
        if (Object.keys(top[user]).length > 0) {
            await influx.write({meas: `lastfm-top-${user}`, values: top[user]});
        }
    }
};
