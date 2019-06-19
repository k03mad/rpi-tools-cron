'use strict';

const {pihole} = require('../../env');
const {request} = require('utils-mad');

/**
 * Get data from Pi-hole api
 * @param {object} query
 * @param {string} path
 * @returns {object}
 */
const sendPiholeRequest = async (query = {}, path = '/admin/api.php') => {
    const {url, auth} = pihole;
    query.auth = auth;

    const {body} = await request.got(url + path, {query, json: true});
    return body;
};

module.exports = {
    sendPiholeRequest,
};
