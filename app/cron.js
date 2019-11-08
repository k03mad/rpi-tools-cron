'use strict';

const {dns, myshows, pi, router, tools, lastfm} = require('require-all')(`${__dirname}/tasks`);

require('./lib/schedule')({

    '@every 1m': [
        pi.apps,
        pi.usage,
        router.usage,
    ],

    '@every 5m': dns.stats,

    '@every 1h': [
        lastfm.artists,
        lastfm.plays,
        lastfm.songs,
        lastfm.top,
        myshows.series,
        myshows.stats,
        myshows.status,
    ],

    '@every 5h': [
        myshows.trends,
        myshows.year,
    ],

    '10 */6 * * *': dns.update,
    '20 */6 * * *': pi.updates,
    '30 4,6 * * *': tools.parse,

});
