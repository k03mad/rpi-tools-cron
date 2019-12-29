'use strict';

const {dns, myshows, pi, router, magnet, lastfm} = require('require-all')(`${__dirname}/tasks`);

require('./lib/schedule')({

    '@every 1m': [
        pi.apps,
        pi.usage,
        router.usage,
    ],

    '@every 1h': [
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
    ],

    '30 4,5 * * *': magnet.parse,

});
