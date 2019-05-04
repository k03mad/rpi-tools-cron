'use strict';

const speed = require('speedtest-net');
const {pihole} = require('../../env');
const {request} = require('utils-mad');

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

/**
 * Get ndr data
 */
const sendNdrRequest = async () => {
    const {body} = await request.got('http://ndr-ru.surge.sh/releases.json', {json: true});
    return body;
};

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
    sendPiholeRequest,
    sendNdrRequest,
    speedTest,
};
