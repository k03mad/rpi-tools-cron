'use strict';

const {lastfm} = require('../../env');
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

        const {body} = await request.got('https://ws.audioscrobbler.com/2.0/', {searchParams});
        body.fmuser = user;

        return body;
    }),
);

/**
 * Get coronavirus data
 * @param {string} path
 * @returns {Promise}
 */
const getCovidData = async path => {
    const {body} = await request.got(`https://corona.lmao.ninja/${path}`);
    return body;
};

module.exports = {
    sendLastFmRequest,
    getCovidData,
};
