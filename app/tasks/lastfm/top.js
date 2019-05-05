'use strict';

const {influx} = require('utils-mad');
const {sendLastFmRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendLastFmRequest('user.gettopartists', {
        period: '1month',
        limit: 15,
    });

    const top = {};
    body.forEach(user => {
        const data = {};
        user.topartists.artist.forEach(artist => {
            data[artist.name] = Number(artist.playcount);
        });
        top[user.fmuser] = data;
    });

    await Promise.all(Object.keys(top).map(user => {
        const values = top[user];
        return influx.write({meas: `lastfm-top-${user}`, values});
    }));
};
