'use strict';

const {dns, myshows, pi, router, magnet, lastfm} = require('require-all')(`${__dirname}/tasks`);

const timers = {
    '* * * * *': [
        pi.apps,
        pi.usage,
        router.usage,
    ],

    '*/10 * * * *': [router.clients],

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
    router.traffic,
];

// часовые кроны запускаем не одновременно, а с разницей в минуту
hourIntervalCrons.forEach((cron, i) => {
    timers[`${i} */1 * * *`] = cron;
});

require('./lib/schedule')(timers);
