'use strict';

const {influx, adg} = require('utils-mad');

module.exports = async () => {
    const {filters} = await adg.query('filtering/status');
    const values = {};

    filters.forEach(elem => {
        values[elem.name] = elem.rules_count;
    });

    await influx.write({meas: 'dns-block-lists', values});
};
