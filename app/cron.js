'use strict';

const {dns, myshows, pi, mik, magnet, lastfm} = require('require-all')(`${__dirname}/tasks`);

const timers = {
    '* * * * *': [
        pi.apps,
        pi.usage,
        mik.usage,
    ],

    '*/10 * * * *': [
        dns.log,
        mik.clients,
    ],

    '30 4,5 * * *': magnet.parse,
};

const hourIntervalCrons = [
    dns.lists,
    dns.stats,
    lastfm.artists,
    lastfm.plays,
    lastfm.songs,
    lastfm.top,
    magnet.stats,
    myshows.series,
    myshows.stats,
    myshows.status,
    myshows.trends,
    myshows.year,
    pi.update,
    mik.traffic,
];

// часовые кроны запускаем не одновременно, а с разницей в минуту
hourIntervalCrons.forEach((cron, i) => {
    timers[`${i} */1 * * *`] = cron;
});

require('./lib/schedule')(timers);
