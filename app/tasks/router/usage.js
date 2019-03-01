'use strict';

const getMikrotik = require('../../lib/mikrotik');
const {log} = require('utils-mad');
const {sendToInflux} = require('../../lib/utils');

/**
 * Get mikrotik usage
 */
module.exports = async () => {
    try {
        const [usage, data, speed] = await getMikrotik([
            '/system/resource/print',
            '/interface/print',
            ['/interface/monitor-traffic', '=interface=ether1', '=once'],
        ]);

        const values = {
            mem: Number(usage['total-memory']) - Number(usage['free-memory']),
            cpu: Number(usage['cpu-load']),
            hdd: Number(usage['total-hdd-space']) - Number(usage['free-hdd-space']),
            datarx: Number(data['rx-byte']),
            datatx: Number(data['tx-byte']),
            speedrx: Number(speed['rx-bits-per-second']),
            speedtx: Number(speed['tx-bits-per-second']),
        };

        await sendToInflux({meas: 'router-usage', values});
    } catch (err) {
        log.print(err);
    }
};
