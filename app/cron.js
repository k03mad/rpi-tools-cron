'use strict';

const {dns, myshows, pi, router, magnet, lastfm} = require('require-all')(`${__dirname}/tasks`);

require('./lib/schedule')({

    '@every 1m': [
        pi.apps,
        pi.usage,
        router.usage,
    ],

    '@every 17m': [
        dns.stats,
        dns.lists,
    ],

    '@every 1h': [
        lastfm.artists,
        lastfm.plays,
        lastfm.songs,
        lastfm.top,
        myshows.series,
        myshows.stats,
        myshows.status,
        magnet.stats,
    ],

    '40 */3 * * *': [
        myshows.trends,
        myshows.year,
    ],

    '20 */6 * * *': pi.update,
    '30 4,5 * * *': magnet.parse,

});
