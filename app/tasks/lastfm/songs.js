'use strict';

const {influx} = require('utils-mad');
const {sendLastFmRequest} = require('../../lib/api');

/** */
module.exports = async () => {
    const body = await sendLastFmRequest('user.gettoptracks', {
        period: '1month',
        limit: 10,
    });

    const top = {};
    body.forEach(user => {
        const data = {};
        user.toptracks.track.forEach(track => {
            data[`${track.artist.name} - ${track.name}`] = Number(track.playcount);
        });
        top[user.fmuser] = data;
    });

    for (const user of Object.keys(top)) {
        if (Object.keys(top[user]).length > 0) {
            await influx.write({meas: `lastfm-songs-${user}`, values: top[user]});
        }
    }
};
