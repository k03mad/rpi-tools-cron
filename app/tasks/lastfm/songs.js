'use strict';

const {influx} = require('utils-mad');
const {sendLastFmRequest} = require('../../lib/api');

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

    await Promise.all(Object.keys(top).map(user => {
        const values = top[user];
        return influx.write({meas: `lastfm-songs-${user}`, values});
    }));
};
