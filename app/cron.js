'use strict';

const {Cron} = require('recron');
const {print} = require('@k03mad/utils');

const tasks = {
    '@every 1m': {
        mik: require('./tasks/mikrotik'),
        pi: require('./tasks/pi'),
        tinkoff: require('./tasks/tinkoff'),
        pinger: require('./tasks/pinger'),
    },

    '@every 5m': {
        request: require('./tasks/request'),
    },

    '@every 10m': {
        next: require('./tasks/next'),
    },

    '@every 1h': {
        st: require('./tasks/st'),
    },

    '@every 6h': {
        apt: require('./tasks/apt'),
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
