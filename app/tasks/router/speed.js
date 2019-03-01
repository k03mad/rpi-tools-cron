'use strict';

const {getMikrotik} = require('../../lib/mikrotik');
const {log} = require('utils-mad');
const {sendToInflux} = require('../../lib/utils');

/**
 * Get mikrotik traffic speed
 */
module.exports = async () => {
    try {
        const [data] = await getMikrotik(['/interface/monitor-traffic', '=interface=ether1', '=once']);
        const values = {
            rx: Number(data['rx-bits-per-second']),
            tx: Number(data['tx-bits-per-second']),
        };

        await sendToInflux({meas: 'router-speed', values});
    } catch (err) {
        log.print(err);
    }
};
