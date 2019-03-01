'use strict';

const {array} = require('utils-mad');
const {mikrotik} = require('./env');
const {RouterOSAPI} = require('node-routeros');

const api = new RouterOSAPI(mikrotik);

/**
 * Get data from mikrotik api
 * @param {string|string[]|Array[]} cmd
 */
const getMikrotik = async cmd => {
    let client;

    try {
        client = await api.connect();
        const response = [];

        for (const elem of array.convert(cmd)) {
            const [data] = await client.write(elem);
            response.push(data);
        }

        await client.close();
        return response;
    } catch (err) {
        await client.close();
        throw err;
    }
};

module.exports = getMikrotik;
