'use strict';

const {dns, pi, router, media} = require('require-all')(`${__dirname}/tasks`);

require('./lib/schedule')({

    '* * * * *': [
        dns.clients,
        dns.hosts,
        dns.stats,
        dns.time,
        pi.usage,
        router.usage,
    ],

    '0 */1 * * *': [
        media.films,
        media.genres,
    ],

    '0 */6 * * *': [
        dns.update,
        pi.network,
        pi.updates,
    ],

});
