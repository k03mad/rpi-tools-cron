'use strict';

const {influx} = require('utils-mad');
const {sendLastFmRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendLastFmRequest('user.getinfo');

    const values = {};
    body.forEach(data => {
        const plays = Number(data.user.playcount);

        if (plays > 0) {
            values[data.fmuser] = Number(data.user.playcount);
        }
    });

    await influx.write({meas: 'lastfm-plays', values});
};
