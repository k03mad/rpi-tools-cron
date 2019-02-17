'use strict';

const cron = require('node-cron');
const t = require('require-all')(`${__dirname}/lib/tasks`);
const {array} = require('utils-mad');

const crons = {
    // every minute
    '* * * * *': [
        t.pi.ping,
        t.pi.usage,
        t.sensors.weather,
    ],
    // every N minutes
    '*/5 * * * *': [
        t.dns.clients,
        t.dns.hosts,
        t.dns.stats,
        t.dns.time,
    ],
    // every N hour, N minute
    '0 */6 * * *': t.dns.update,
    // at N hour, N minute
    '30 5 * * *': t.pi.reboot,
};

for (const [key, value] of Object.entries(crons)) {
    for (const func of array.convert(value)) {
        cron.schedule(key, () => func());
    }
}
