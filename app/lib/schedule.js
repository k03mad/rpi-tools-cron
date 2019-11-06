'use strict';

const cron = require('node-cron');
const {array, print, date} = require('utils-mad');

module.exports = crons => {
    for (const [key, value] of Object.entries(crons)) {
        for (const func of array.convert(value)) {
            cron.schedule(
                key,
                () => {
                    const id = Math.floor(Math.random() * Math.floor(100000)); const now = date.now();

                    console.log(`before: cron "${key}" id "${id}" date "${now}"`);
                    return func()
                        .then(console.log(`then: cron "${key}" id "${id}" date "${now}"`))
                        .catch(err => print.ex(err, {
                            add: `catch: cron "${key}" id "${id}" date "${now}"`,
                            exit: true,
                        }));
                },
                {timezone: 'Europe/Moscow'},
            );
        }
    }
};
