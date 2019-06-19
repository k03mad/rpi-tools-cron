'use strict';

const {influx, date, myshows} = require('utils-mad');

module.exports = async () => {
    const dates = {
        current: date.now('YYYY'),
        previous: date.sub({form: 'YYYY', period: 'year'}),
    };

    await Promise.all(Object.keys(dates).map(async elem => {
        const values = {};

        const body = await myshows.get({method: 'shows.Search', params: {query: dates[elem]}});
        body.forEach(series => {
            values[series.title.trim()] = series.watching;
        });

        await influx.write({meas: `myshows-year-${elem}`, values});
    }));
};
