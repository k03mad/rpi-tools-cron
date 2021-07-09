'use strict';

const {Cron} = require('recron');
const {print} = require('@k03mad/utils');

const tasks = {
    '* * * * *': {
        mik: require('./tasks/mikrotik'),
        pi: require('./tasks/pi'),
        tinkoff: require('./tasks/tinkoff'),
        pinger: require('./tasks/pinger'),
    },

    '*/5 * * * *': {
        request: require('./tasks/request'),
    },

    '*/10 * * * *': {
        next: require('./tasks/next'),
    },

    '0 */1 * * *': {
        st: require('./tasks/st'),
    },

    '0 */6 * * *': {
        apt: require('./tasks/apt'),
    },

    '0 5 * * *': {
        magnet: require('./tasks/magnet'),
    },
};

const cron = new Cron();
cron.start();

for (const [key, value] of Object.entries(tasks)) {
    for (const [name, func] of Object.entries(value)) {
        cron.schedule(key, async () => {
            try {
                await func();
            } catch (err) {
                print.ex(err, {
                    before: `${key} :: ${name}`,
                    afterline: false,
                });
            }
        }, {timezone: 'Europe/Moscow'});
    }
}
