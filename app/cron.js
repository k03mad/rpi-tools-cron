'use strict';

const {dns, lastfm, myshows, pi, router, tmdb} = require('require-all')(`${__dirname}/tasks`);

require('./lib/schedule')({

    '* * * * *': [
        dns.clients,
        dns.hosts,
        dns.stats,
        dns.time,
        pi.usage,
        router.usage,
    ],

    '*/5 * * * *': [
        lastfm.artists,
        lastfm.plays,
        lastfm.top,
    ],

    '0 */1 * * *': [
        myshows.stats,
        myshows.status,
        myshows.year,
        tmdb.popular,
        tmdb.ratings,
    ],

    '0 */6 * * *': [
        dns.update,
        pi.network,
        pi.updates,
    ],

});
