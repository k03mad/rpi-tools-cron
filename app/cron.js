'use strict';

const {dns, myshows, pi, router, parser} = require('require-all')(`${__dirname}/tasks`);

require('./lib/schedule')({

    '* * * * *': [
        dns.clients,
        dns.hosts,
        dns.network,
        dns.stats,
        dns.time,
        pi.usage,
        router.usage,
    ],

    '0 */1 * * *': [
        myshows.series,
        myshows.stats,
        myshows.status,
        myshows.year,
    ],

    '0 */6 * * *': [
        dns.update,
        pi.network,
        pi.updates,
    ],

    '0 5 * * *': parser.shows,
    '30 5 * * *': parser.films,

});
