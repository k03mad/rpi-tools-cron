'use strict';

const {Cron} = require('recron');
const {print} = require('@k03mad/utils');

const tasks = {
    '@every 10s': {
        pinger: require('./tasks/pinger'),
    },

    '@every 1m': {
        mik: require('./tasks/mikrotik'),
        pi: require('./tasks/pi'),
        tinkoff: require('./tasks/tinkoff'),
    },

    '@every 5m': {
        next: require('./tasks/next'),
        request: require('./tasks/request'),
    },

    '@every 1h': {
        apt: require('./tasks/apt'),
        st: require('./tasks/st'),
    },

    '@every 12h': {
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
