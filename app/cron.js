'use strict';

const cron = require('node-cron');
const t = require('require-all')(`${__dirname}/lib/tasks`);

cron.schedule('* * * * *', () => t.pi.usage());
cron.schedule('* * * * *', () => t.sensors.weather());
cron.schedule('0 * * * *', () => t.dns.update());
cron.schedule('30 5 * * *', () => t.pi.reboot());
