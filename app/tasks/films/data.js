'use strict';

const {influx, array} = require('utils-mad');
const {sendNdrRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendNdrRequest();

    const data = ['genre', 'country', 'year'];

    await Promise.all(data.map(elem => {
        const values = {};
        body.forEach(film => array.count(film[elem].split(', '), values));

        return influx.write({meas: `films-data-${elem}`, values});
    }));
};
