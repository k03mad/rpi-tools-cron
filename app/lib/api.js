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
        const searchParams = {
            method, user,
            api_key: lastfm.key,
            format: 'json',
            ...params,
        };

        const {body} = await request.got('https://ws.audioscrobbler.com/2.0/', {searchParams, responseType: 'json'});
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
        responseType: 'json',
        headers: {Authorization: `Basic ${adg.auth}`},
        timeout: 30000,
        ...opts,
    });
    return body;
};

/**
 * Get IP lookup
 * @param {string} ip
 */
const sendIpLookupRequest = async ip => {
    const {body} = await request.got(`https://extreme-ip-lookup.com/json/${ip}`, {responseType: 'json'});
    return body;
};

module.exports = {
    sendAdgRequest,
    sendLastFmRequest,
    sendIpLookupRequest,
};
