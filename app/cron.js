'use strict';

const schedule = require('./lib/schedule');
const t = require('require-all')(`${__dirname}/tasks`);

schedule({

    '* * * * *': [
        t.dns.clients,
        t.dns.hosts,
        t.dns.stats,
        t.dns.time,
        t.pi.usage,
        t.router.usage,
    ],

    '0 */6 * * *': [
        t.dns.update,
        t.pi.network,
        t.pi.updates,
    ],

});
