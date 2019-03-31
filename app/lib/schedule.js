'use strict';

const cron = require('node-cron');
const {array, log} = require('utils-mad');

module.exports = crons => {
    for (const [key, value] of Object.entries(crons)) {
        for (const func of array.convert(value)) {
            cron.schedule(key, () => func().catch(err => log.print(err)));
        }
    }
};
