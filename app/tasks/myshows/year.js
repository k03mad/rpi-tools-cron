'use strict';

const {influx, date, parse} = require('utils-mad');

module.exports = async () => {
    const SHOWS_COUNT = 20;

    const dates = {
        current: date.now('YYYY'),
        previous: date.sub({form: 'YYYY', period: 'year'}),
    };

    await Promise.all(Object.keys(dates).map(async year => {
        const parsed = await parse.text({
            selector: '.table__row_even .table__cell_countLooking span , .series-title__local-title a',
            url: 'https://myshows.me/search/all/',
            gotOpts: {
                query: {year: dates[year]},
                headers: {'user-agent': 'Mozilla/5.0 (Linux; Android 8.0; Pixel 2 Build/OPD3.170816.012) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/74.0.3729.169 Mobile Safari/537.36'},
            },
        });

        const values = {};

        for (let i = 0; i < parsed.length && i < SHOWS_COUNT * 2; i += 2) {
            values[parsed[i]] = Number(parsed[i + 1]);
        }

        await influx.write({meas: `myshows-year-${year}`, values});
    }));
};
