'use strict';

const {pihole, database} = require('../../env');
const {request, influx} = require('utils-mad');

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
const sendToInflux = data => influx.write({...database, ...data});

/**
 * Get data from Pi-hole api
 * @param {Object} query to send
 */
const sendPiholeRequest = async (query = {}) => {
    const {url, auth} = pihole;
    query.auth = auth;

    const {body} = await request.got(url, {query, json: true});
    return body;
};

module.exports = {
    runRepoScript,
    sendToInflux,
    sendPiholeRequest,
};
