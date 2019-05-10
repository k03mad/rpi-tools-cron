'use strict';

const {influx, date} = require('utils-mad');
const {sendMyshowsRequest} = require('../../lib/api');

module.exports = async () => {
    const values = {};
    const years = [date.now('YYYY'), date.sub({form: 'YYYY', period: 'year'})];

    await Promise.all(years.map(async query => {
        const body = await sendMyshowsRequest('shows.Search', {query});

        body.forEach(elem => {
            values[elem.title.trim()] = elem.watching;
        });
    }));

    await influx.write({meas: 'myshows-year', values});
};
