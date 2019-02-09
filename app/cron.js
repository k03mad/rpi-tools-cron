'use strict';

const cron = require('node-cron');
const t = require('require-all')(`${__dirname}/lib/tasks`);

cron.schedule('* * * * *', () => Promise.all([
    t.pi.usage(),
    t.sensors.weather(),
]));

cron.schedule('*/10 * * * *', () => Promise.all([
    t.dns.clients(),
    t.dns.hosts(),
    t.dns.stats(),
]));

cron.schedule('*/5 * * * *', () => t.dns.time());
cron.schedule('0 */6 * * *', () => t.dns.update());
cron.schedule('30 5 * * *', () => t.pi.reboot());
