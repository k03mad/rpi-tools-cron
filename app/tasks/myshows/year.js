'use strict';

const randomMua = require('random-mua');
const {influx, date, parse} = require('utils-mad');

module.exports = async () => {
    const SHOWS_COUNT = 20;

    const dates = {
        current: date.now('YYYY'),
        previous: date.sub({format: 'YYYY', period: 'years'}),
    };

    await Promise.all(Object.keys(dates).map(async year => {
        const parsed = await parse.text({
            selector: '.table__row_even .table__cell_countLooking span , .series-title__local-title a',
            url: 'https://myshows.me/search/all/',
            gotOpts: {
                query: {year: dates[year]},
                headers: {'user-agent': randomMua('m')},
            },
        });

        const values = {};

        for (let i = 0; i < parsed.length && i < SHOWS_COUNT * 2; i += 2) {
            values[parsed[i]] = Number(parsed[i + 1]);
        }

        await influx.write({meas: `myshows-year-${year}`, values});
    }));
};
