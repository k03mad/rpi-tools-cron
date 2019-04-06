'use strict';

const {array} = require('utils-mad');
const {mikrotik} = require('../../env');
const {RouterOSAPI} = require('node-routeros');

const api = new RouterOSAPI(mikrotik);

/**
 * Get data from mikrotik api
 * @param {string|string[]} cmd
 */
module.exports = async cmd => {
    let client, error, res;

    try {
        client = await api.connect();
        const response = [];

        for (const elem of array.convert(cmd)) {
            const data = await client.write(elem);
            response.push(data);
        }

        res = response;
    } catch (err) {
        error = err;
    }

    try {
        await client.close();
    } catch (err) {}

    if (res) {
        return res;
    }

    throw error;
};
