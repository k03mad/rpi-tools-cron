'use strict';

const {influx} = require('utils-mad');
const {sendMyshowsRequest} = require('../../lib/api');

module.exports = async () => {
    const {stats: values} = await sendMyshowsRequest('profile.Get');
    await influx.write({meas: 'myshows-stats', values});
};
