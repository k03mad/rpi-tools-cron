'use strict';

const {getCovidData} = require('../../lib/api');
const {influx} = require('utils-mad');

module.exports = async () => {
    const values = await getCovidData('all');
    await influx.write({meas: 'corona-all', values});
};
