'use strict';

const getMikrotik = require('../../lib/mikrotik');
const oui = require('oui');
const {log} = require('utils-mad');
const {sendToInflux} = require('../../lib/utils');

/**
 * Get mikrotik usage
 */
module.exports = async () => {
    try {
        const [[usage], [speed], ether, wifi] = await getMikrotik([
            '/system/resource/print',
            ['/interface/monitor-traffic', '=interface=ether1', '=once'],
            '/interface/ethernet/print',
            '/interface/wireless/registration-table/print',
        ]);

        const values = {
            mem: Number(usage['total-memory']) - Number(usage['free-memory']),
            cpu: Number(usage['cpu-load']),
            hdd: Number(usage['total-hdd-space']) - Number(usage['free-hdd-space']),
            // data usage by ehter1 (WAN)
            datarx: Number(ether[0]['rx-bytes']),
            datatx: Number(ether[0]['tx-bytes']),
            // speed usage by ehter1 (WAN)
            speedrx: Number(speed['rx-bits-per-second']),
            speedtx: Number(speed['tx-bits-per-second']),
        };

        const signalData = {};
        const trafficData = {};

        // signal-strength and data usage by wifi clients
        wifi.forEach(elem => {
            const dbm = elem['signal-strength'].replace(/@.+/, '');
            const trf = elem.bytes.replace(',', '.');
            const mac = elem['mac-address'];

            const [vendor] = (oui(mac) || '').split('\n')[0].split(' ');
            const key = `${vendor}_${mac}`;

            signalData[key] = Number(dbm);
            trafficData[key] = Number(trf);
        });

        // data usage by ethernet client, except WAN and zero-traffic
        ether.forEach(elem => {
            const {name} = elem;
            const rx = Number(elem['rx-bytes']);
            const tx = Number(elem['tx-bytes']);

            if (name !== 'ether1' && (rx !== 0 || tx !== 0)) {
                trafficData[name] = rx + tx;
            }
        });

        await Promise.all([
            sendToInflux({meas: 'router-usage', values}),
            sendToInflux({meas: 'router-signal', values: signalData}),
            sendToInflux({meas: 'router-traffic', values: trafficData}),
        ]);
    } catch (err) {
        log.print(err);
    }
};
