'use strict';

const {array, print} = require('utils-mad');
const {Cron} = require('recron');

module.exports = crons => {
    const cron = new Cron();
    cron.start();

    for (const [key, value] of Object.entries(crons)) {
        for (const func of array.convert(value)) {
            cron.schedule(key, async () => {
                try {
                    await func();
                } catch (err) {
                    print.ex(err, {exit: true});
                }
            }, {timezone: 'Europe/Moscow'});
        }
    }
};
