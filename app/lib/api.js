'use strict';

const {pihole, lastfm} = require('../../env');
const {request, array} = require('utils-mad');

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

/**
 * Get last.fm data
 * @param {string} method
 * @param {object} params
 * @returns {object}
 */
const sendLastFmRequest = (method, params = {}) => Promise.all(
    array.convert(lastfm.users).map(async user => {
        const query = {
            method, user,
            api_key: lastfm.key,
            format: 'json',
            ...params,
        };

        const {body} = await request.got('https://ws.audioscrobbler.com/2.0/', {query, json: true});
        body.fmuser = user;
        return body;
    }),
);

module.exports = {
    sendLastFmRequest,
    sendPiholeRequest,
};
