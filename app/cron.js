'use strict';

const cron = require('node-cron');
const t = require('require-all')(`${__dirname}/tasks`);

cron.schedule('0 * * * *', () => t.dns.update());
cron.schedule('30 5 * * *', () => t.pi.reboot());
