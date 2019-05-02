'use strict';

const {dns, pi, router, staff} = require('require-all')(`${__dirname}/tasks`);

require('./lib/schedule')({

    '* * * * *': [
        dns.clients,
        dns.hosts,
        dns.stats,
        dns.time,
        pi.usage,
        router.usage,
    ],

    '0 */6 * * *': [
        dns.update,
        pi.network,
        pi.updates,
        staff.ndr,
    ],

});
