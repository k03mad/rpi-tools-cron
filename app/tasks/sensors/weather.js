'use strict';

const parseJson = require('json-parse-better-errors');
const path = require('path');
const {log, shell} = require('utils-mad');
const {sendToInflux} = require('../../lib/utils');

/**
 * Send connected sensors data
 */
const sendSensorsData = async () => {
    try {
        const data = await shell.run(`python ${path.join(__dirname, 'get.py')}`);
        const values = parseJson(data);

        await sendToInflux({meas: 'sensors', values});
    } catch (err) {
        log.print(err);
    }
};

module.exports = sendSensorsData;
