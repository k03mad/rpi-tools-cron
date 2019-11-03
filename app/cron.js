'use strict';

const {dns, myshows, pi, router, tools, lastfm} = require('require-all')(`${__dirname}/tasks`);

require('./lib/schedule')({

    '* * * * *': [
        dns.stats,
        pi.apps,
        pi.usage,
        router.usage,
    ],

    '40 */1 * * *': [
        lastfm.artists,
        lastfm.plays,
        lastfm.songs,
        lastfm.top,
        myshows.series,
        myshows.stats,
        myshows.status,
    ],

    '20 */5 * * *': [
        myshows.trends,
        myshows.year,
    ],

    '10 */6 * * *': dns.update,
    '20 */6 * * *': pi.updates,
    '30 4,6 * * *': tools.parse,

});
