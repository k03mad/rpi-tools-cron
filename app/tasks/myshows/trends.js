'use strict';

const {influx, parse, ua} = require('utils-mad');

module.exports = async () => {
    const SHOWS_COUNT = 20;

    const parsed = await parse.text({
        selector: '.catalogTable .alignRight , .catalogTable a',
        url: 'https://myshows.me/ratings/trends/',
        gotOpts: {
            headers: {'user-agent': ua.random.desktop()},
            timeout: 20000,
        },
    });

    const values = {};

    for (let i = 0; i < parsed.length && i < SHOWS_COUNT * 2; i += 2) {
        values[parsed[i]] = Number(parsed[i + 1].replace(/\s/, ''));
    }

    await influx.write({meas: 'myshows-trends', values});
};
