'use strict';

const {array} = require('utils-mad');
const {influx, date, parse, ua} = require('utils-mad');

module.exports = async () => {
    const SHOWS_COUNT = 20;
    const current = Number(date.now('YYYY'));

    const dates = {
        current,
        previous: current - 1,
        next: current + 1,
        last5: [2, 3, 4, 5, 6].map(elem => current - elem),
    };

    for (const year of Object.keys(dates)) {
        const series = {};

        for (const elem of array.convert(dates[year])) {
            const parsed = await parse.text({
                selector: '.catalogTable .alignRight:nth-child(3) , td a',
                url: `https://myshows.me/search/all/?year=${elem}`,
                gotOpts: {
                    headers: {'user-agent': ua.random.desktop()},
                    timeout: 30000,
                },
            });

            for (let i = 0; i < parsed.length; i += 2) {
                series[parsed[i]] = Number(parsed[i + 1].replace(/\s/g, ''));
            }

            if (year === 'next' && Object.keys(series).length === 0) {
                continue;
            }
        }

        const values = Object.fromEntries(Object.entries(series).slice(0, SHOWS_COUNT));
        await influx.write({meas: `myshows-year-${year}`, values});
    }
};
