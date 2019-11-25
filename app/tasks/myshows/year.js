'use strict';

const {influx, date, parse, ua, request} = require('utils-mad');

module.exports = async () => {
    const SHOWS_COUNT = 20;

    const dates = {
        current: date.now('YYYY'),
        previous: date.sub({format: 'YYYY', period: 'years'}),
    };

    await Promise.all(Object.keys(dates).map(async year => {
        const parsed = await parse.text({
            selector: '.catalogTable .alignRight:nth-child(3) , td a',
            url: 'https://myshows.me/search/all/?year=${dates[year]}',
            gotOpts: {
                headers: {'user-agent': ua.random.desktop()},
                timeout: 30000,
            },
        });

        const values = {};

        for (let i = 0; i < parsed.length && i < SHOWS_COUNT * 2; i += 2) {
            values[parsed[i]] = Number(parsed[i + 1].replace(/\s/g, ''));
        }

        await influx.write({meas: `myshows-year-${year}`, values});
    }));
};
