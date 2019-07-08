'use strict';

const {dns, myshows, pi, router, parser} = require('require-all')(`${__dirname}/tasks`);

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
        myshows.trends,
        myshows.year,
    ],

    '0 */6 * * *': [
        dns.update,
        pi.updates,
    ],

    '0 7 * * *': parser.shows,
    '30 7 * * *': parser.films,

});
