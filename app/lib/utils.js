'use strict';

const {database: {url, db}} = require('../../env');
const {influx} = require('utils-mad');

/**
 * Open repo and run script
 * @param {string} repo to change dir
 * @param {string} script to run
 * @returns {string}
 */
const runRepoScript = (repo, script) => [
    `cd ~/git/${repo}`,
    'git reset --hard',
    'git pull',
    'npm run setup',
    `npm run ${script}`,
];

/**
 * Store data to InfluxDB
 * @param {Object} data to send
 */
const sendToInflux = data => influx.write({
    url, db,
    meas: data.meas,
    tags: data.tags,
    values: data.values,
});

module.exports = {
    runRepoScript,
    sendToInflux,
};
