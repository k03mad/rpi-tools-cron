'use strict';

const {influx, date, myshows} = require('utils-mad');

module.exports = async () => {
    const values = {};
    const years = [date.now('YYYY'), date.sub({form: 'YYYY', period: 'year'})];

    await Promise.all(years.map(async query => {
        const body = await myshows.get({method: 'shows.Search', params: {query}});

        body.forEach(elem => {
            values[elem.title.trim()] = elem.watching;
        });
    }));

    await influx.write({meas: 'myshows-year', values});
};
