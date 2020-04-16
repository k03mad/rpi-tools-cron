'use strict';

const {
    dns, myshows, pi,
    mik, magnet, lastfm,
    corona, weather,
} = require('require-all')(`${__dirname}/tasks`);

const timers = {
    '* * * * *': [
        mik.clients,
        mik.usage,
        pi.apps,
        pi.usage,
    ],

    '30 3 * * *': pi.prune,

    '15 4,5 * * *': mik.pptp,
    '30 4,5 * * *': magnet.parse,
};

const hourIntervalCrons = [
    corona.all,
    corona.countries,
    dns.lists,
    dns.stats,
    lastfm.artists,
    lastfm.plays,
    lastfm.songs,
    lastfm.top,
    magnet.stats,
    mik.traffic,
    myshows.series,
    myshows.stats,
    myshows.status,
    myshows.trends,
    myshows.year,
    pi.update,
    weather.moscow,
];

// часовые кроны запускаем не одновременно, а с разницей в минуту
hourIntervalCrons.forEach((cron, i) => {
    timers[`${i} */1 * * *`] = cron;
});

require('./lib/schedule')(timers);
