'use strict';

const {getCovidData} = require('../../lib/api');
const {influx} = require('utils-mad');

module.exports = async () => {
    const countries = ['russia', 'ukraine', 'belarus'];

    for (const country of countries) {
        const data = await getCovidData(`countries/${country}`);
        const values = {};

        for (const [key, value] of Object.entries(data)) {
            if (typeof value !== 'object') {
                values[key] = value;
            }
        }

        await influx.write({meas: `corona-${country}`, values});
    }
};
