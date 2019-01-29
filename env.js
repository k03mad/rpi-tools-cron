'use strict';

// remove "Automatic enabling of cancellation of promises is deprecated"
process.env.NTBA_FIX_319 = true;

module.exports = {
    database: {
        url: process.env.INFLUX_URL,
        db: process.env.INFLUX_DB,
    },
};
