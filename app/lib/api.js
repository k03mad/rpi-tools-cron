'use strict';

const {pihole, lastfm, tmdb} = require('../../env');
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
 * Get chsv data
 * @returns {object}
 */
const sendChsvRequest = async () => {
    const {body} = await request.got('http://chsv.ml/releases.json', {json: true});
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

/**
 * Get tmdb data
 * @param {object} opts
 * @param {string} opts.path
 * @param {object} opts.params
 * @param {number} opts.count
 * @returns {Array}
 */
const sendTmdbRequest = async ({path, params = {}, count = 20} = {}) => {
    const DEFAULT_ONE_PAGE_COUNT = 20;

    const pages = Math.ceil(count / DEFAULT_ONE_PAGE_COUNT);
    const output = [];

    for (let i = 0; i < pages; i++) {
        const query = {
            api_key: tmdb.key,
            language: 'ru-RU',
            page: i + 1,
            ...params,
        };

        const {body} = await request.got(`https://api.themoviedb.org/3/${path}`, {query, json: true});
        output.push(...body.results);
    }

    return output.slice(0, count);
};

module.exports = {
    sendLastFmRequest,
    sendChsvRequest,
    sendPiholeRequest,
    sendTmdbRequest,
};
