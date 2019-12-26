'use strict';

const {influx} = require('utils-mad');
const {sendAdgRequest} = require('../../lib/api');

module.exports = async () => {
    const {filters} = await sendAdgRequest('filtering/status');
    const values = {};

    filters.forEach(elem => {
        values[elem.name] = elem.rules_count;
    });

    await influx.write({meas: 'dns-block-lists', values});
};
