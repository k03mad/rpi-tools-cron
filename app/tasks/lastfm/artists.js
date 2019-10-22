'use strict';

const {influx} = require('utils-mad');
const {sendLastFmRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendLastFmRequest('library.getartists');

    const values = {};
    body.forEach(data => {
        values[data.fmuser] = Number(data.artists['@attr'].total);
    });

    await influx.write({meas: 'lastfm-artists', values});
};
