'use strict';

const {influx, array} = require('utils-mad');
const {sendChsvRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendChsvRequest();

    const data = ['genre', 'country', 'year'];

    await Promise.all(data.map(elem => {
        const values = {};

        body.forEach(film => {
            array.count(String(film[elem]).split(', '), values);
        });

        return influx.write({meas: `films-data-${elem}`, values});
    }));
};
