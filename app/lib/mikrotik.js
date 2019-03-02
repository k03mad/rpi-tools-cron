'use strict';

const {array} = require('utils-mad');
const {mikrotik} = require('./env');
const {RouterOSAPI} = require('node-routeros');

/**
 * Get data from mikrotik api
 * @param {string|string[]|Array[]} cmd
 */
module.exports = async cmd => {
    let client;

    try {
        const api = new RouterOSAPI(mikrotik);
        client = await api.connect();
        const response = [];

        for (const elem of array.convert(cmd)) {
            const data = await client.write(elem);
            response.push(data);
        }

        await client.close();
        return response;
    } catch (err) {
        await client.close();
        throw err;
    }
};
