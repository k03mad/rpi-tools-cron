'use strict';

const {dns, lastfm, pi, router} = require('require-all')(`${__dirname}/tasks`);

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

    '0 */6 * * *': [
        dns.update,
        pi.network,
        pi.updates,
    ],

});
