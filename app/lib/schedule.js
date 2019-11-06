'use strict';

const cron = require('node-cron');
const {array, print, date} = require('utils-mad');

module.exports = crons => {
    for (const [key, value] of Object.entries(crons)) {
        for (const func of array.convert(value)) {
            cron.schedule(
                key,
                () => {
                    const id = Math.floor(Math.random() * Math.floor(100000));

                    console.log(`before: ${id} "${key}" ${date.now()}`);
                    return func()
                        .then(console.log(`then: ${id} "${key}" ${date.now()}`))
                        .catch(err => print.ex(err, {
                            add: `catch: ${id} "${key}" ${date.now()}`,
                            exit: true,
                        }));
                },
                {timezone: 'Europe/Moscow'},
            );
        }
    }
};
