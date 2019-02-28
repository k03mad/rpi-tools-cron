'use strict';

const {mikrotik} = require('./env');
const {RouterOSAPI} = require('node-routeros');

const api = new RouterOSAPI(mikrotik);

/**
 * Get data from mikrotik api
 * @param {string} cmd
 */
const getMikrotik = async cmd => {
    let client;

    try {
        client = await api.connect();
        const data = await client.write(cmd);
        await client.close();
        return data;
    } catch (err) {
        await client.close();
        throw err;
    }
};

module.exports = {getMikrotik};
