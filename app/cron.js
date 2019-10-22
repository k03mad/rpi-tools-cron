'use strict';

const {dns, myshows, pi, router, tools, lastfm} = require('require-all')(`${__dirname}/tasks`);

require('./lib/schedule')({

    '* * * * *': [
        pi.apps,
        pi.usage,
        router.usage,
    ],

    '*/10 * * * *': dns.time,

    '*/30 * * * *': [
        dns.clients,
        dns.hosts,
        dns.stats,
    ],

    '0 */1 * * *': [
        myshows.series,
        myshows.stats,
        myshows.status,
        lastfm.artists,
        lastfm.plays,
        lastfm.top,
    ],

    '0 */5 * * *': [
        myshows.trends,
        myshows.year,
    ],

    '0 */6 * * *': [
        dns.update,
        pi.updates,
    ],

    '30 */6 * * *': tools.parse,

});
