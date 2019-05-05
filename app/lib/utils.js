'use strict';

const speed = require('speedtest-net');

/**
 * Get speed test results
 */
const speedTest = () => {
    const test = speed({
        maxTime: 10000,
        pingCount: 10,
    });
    return new Promise((resolve, reject) => {
        test.on('data', data => resolve(data));
        test.on('error', err => reject(err));
    });
};

module.exports = {
    speedTest,
};
