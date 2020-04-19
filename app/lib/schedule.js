'use strict';

const {array, print, promise} = require('utils-mad');
const {Cron} = require('recron');

module.exports = crons => {
    const cron = new Cron();
    cron.start();

    for (const [key, value] of Object.entries(crons)) {
        for (const func of array.convert(value)) {
            cron.schedule(key, async () => {
                try {
                    await func();
                    await promise.delay();
                } catch (err) {
                    print.ex(err, {before: key, afterline: false, exit: true});
                }
            }, {timezone: 'Europe/Moscow'});
        }
    }
};
