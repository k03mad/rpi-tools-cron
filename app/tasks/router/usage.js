'use strict';

const {getMikrotik} = require('../../lib/mikrotik');
const {log} = require('utils-mad');
const {sendToInflux} = require('../../lib/utils');

/**
 * Get mikrotik usage
 */
module.exports = async () => {
    try {
        const [data] = await getMikrotik('/system/resource/print');
        const values = {
            mem: Number(data['total-memory']) - Number(data['free-memory']),
            cpu: Number(data['cpu-load']),
            hdd: Number(data['total-hdd-space']) - Number(data['free-hdd-space']),
        };

        await sendToInflux({meas: 'mik', values});
    } catch (err) {
        log.print(err);
    }
};
