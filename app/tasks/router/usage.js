'use strict';

const getMikrotik = require('../../lib/mikrotik');
const {log} = require('utils-mad');
const {sendToInflux} = require('../../lib/utils');

/**
 * Get mikrotik usage
 */
module.exports = async () => {
    try {
        const [[usage], [data], [speed], signal] = await getMikrotik([
            '/system/resource/print',
            '/interface/print',
            ['/interface/monitor-traffic', '=interface=ether1', '=once'],
            ['/interface/wireless/registration-table/print'],
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

        const signalData = {};
        signal.forEach(elem => {
            const mac = elem['mac-address'];
            const dbm = elem['signal-strength'].replace(/@.+/, '');
            signalData[mac] = Number(dbm);
        });

        await Promise.all([
            sendToInflux({meas: 'router-usage', values}),
            sendToInflux({meas: 'router-signal', values: signalData}),
        ]);
    } catch (err) {
        log.print(err);
    }
};
