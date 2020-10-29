'use strict';

const {Cron} = require('recron');
const {print} = require('utils-mad');

const tasks = {
    '* * * * *': {
        mik: require('./tasks/mikrotik'),
        pi: require('./tasks/pi'),
    },

    '* */6 * * *': {
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
                    exit: true,
                });
            }
        }, {timezone: 'Europe/Moscow'});
    }
}
