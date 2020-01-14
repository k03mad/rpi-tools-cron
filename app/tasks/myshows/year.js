'use strict';

const {influx, date, parse, ua} = require('utils-mad');

module.exports = async () => {
    const SHOWS_COUNT = 20;
    const current = Number(date.now('YYYY'));

    const dates = {
        current,
        previous: current - 1,
        next: current + 1,
    };

    for (const year of Object.keys(dates)) {
        const parsed = await parse.text({
            selector: '.catalogTable .alignRight:nth-child(3) , td a',
            url: `https://myshows.me/search/all/?year=${dates[year]}`,
            gotOpts: {
                headers: {'user-agent': ua.random.desktop()},
                timeout: 30000,
            },
        });

        const values = {};

        for (let i = 0; i < parsed.length && i < SHOWS_COUNT * 2; i += 2) {
            values[parsed[i]] = Number(parsed[i + 1].replace(/\s/g, ''));
        }

        if (year === 'next' && Object.keys(values).length === 0) {
            continue;
        }

        await influx.write({meas: `myshows-year-${year}`, values});
    }
};
