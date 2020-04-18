'use strict';

const {influx, adg} = require('utils-mad');

module.exports = async () => {
    const {filters, whitelist_filters: filtersWl} = await adg.get('filtering/status');
    const values = {};

    [...filters, ...filtersWl].forEach(elem => {
        values[elem.name] = elem.rules_count;
    });

    await influx.write({meas: 'dns-block-lists', values});
};
