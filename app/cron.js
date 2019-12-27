'use strict';

const {dns, myshows, pi, router, magnet, lastfm} = require('require-all')(`${__dirname}/tasks`);

require('./lib/schedule')({

    '* * * * *': [
        pi.apps,
        pi.usage,
        router.usage,
    ],

    '17 * * * *': [
        dns.stats,
        dns.lists,
    ],

    '33 * * * *': [
        lastfm.artists,
        lastfm.plays,
        lastfm.songs,
        lastfm.top,
    ],

    '43 * * * *': [
        myshows.series,
        myshows.stats,
        myshows.status,
    ],

    '0 */1 * * *': [magnet.stats],

    '50 */2 * * *': [
        myshows.trends,
        myshows.year,
    ],

    '20 */6 * * *': pi.update,
    '30 4,5 * * *': magnet.parse,

});
