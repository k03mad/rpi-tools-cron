'use strict';

const {influx} = require('utils-mad');
const {sendAdgRequest} = require('../../lib/api');

module.exports = async () => {
    const apiData = await sendAdgRequest('filtering/status');

    const values = {};

    apiData.filters.forEach(elem => {
        values[elem.name] = elem.rules_count;
    });

    await influx.write({meas: 'dns-block-lists', values});
};
