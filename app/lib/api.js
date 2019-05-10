'use strict';

const {pihole, lastfm, tmdb, myshows} = require('../../env');
const {request, array} = require('utils-mad');

/**
 * Get data from Pi-hole api
 * @param {Object} query
 */
const sendPiholeRequest = async (query = {}) => {
    const {url, auth} = pihole;
    query.auth = auth;

    const {body} = await request.got(url, {query, json: true});
    return body;
};

/**
 * Get last.fm data
 * @param {string} method
 * @param {Object} params
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
 * @param {Object} opts
 * @param {string} opts.path
 * @param {Object} opts.params
 * @param {number} opts.count
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

/**
 * Get myshows data
 * @param {string} method
 * @param {Object} params
 */
const sendMyshowsRequest = async (method, params = {}) => {
    const {login, password, client, secret} = myshows;

    const auth = await request.got('https://myshows.me/oauth/token', {
        body: {
            grant_type: 'password',
            client_id: client,
            client_secret: secret,
            username: login,
            password,
        },
        json: true,
    });

    const {access_token: token, token_type: type} = auth.body;

    const {body} = await request.got('https://api.myshows.me/v2/rpc/', {
        Authorization: `${type} ${token}`,
        body: {
            id: 1,
            jsonrpc: '2.0',
            params: {login, ...params},
            method,
        },
        json: true,
    });

    return body.result;
};

module.exports = {
    sendLastFmRequest,
    sendPiholeRequest,
    sendTmdbRequest,
    sendMyshowsRequest,
};
