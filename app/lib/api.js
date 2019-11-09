'use strict';

const {lastfm, adg} = require('../../env');
const {request, array} = require('utils-mad');

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
 * Get AdGuard Home data
 * @param {string} path
 * @param {object} opts
 * @returns {object}
 */
const sendAdgRequest = async (path, opts) => {
    const {body} = await request.got(adg.url + path, {
        json: true,
        headers: {Authorization: `Basic ${adg.auth}`},
        timeout: 20000,
        ...opts,
    });
    return body;
};

module.exports = {
    sendAdgRequest,
    sendLastFmRequest,
};
