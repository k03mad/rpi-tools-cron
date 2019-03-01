'use strict';

const cron = require('node-cron');
const t = require('require-all')(`${__dirname}/tasks`);
const {array} = require('utils-mad');

const crons = {

    '* * * * *': [
        t.dns.clients,
        t.dns.hosts,
        t.dns.stats,
        t.dns.time,
        t.pi.usage,
        t.router.usage,
    ],

    '0 */3 * * *': t.dns.update,

};

for (const [key, value] of Object.entries(crons)) {
    for (const func of array.convert(value)) {
        cron.schedule(key, () => func());
    }
}
