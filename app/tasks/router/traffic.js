'use strict';

const {getMikrotik} = require('../../lib/mikrotik');
const {log} = require('utils-mad');
const {sendToInflux} = require('../../lib/utils');

/**
 * Get mikrotik traffic tx rx
 */
module.exports = async () => {
    try {
        const [data] = await getMikrotik('/interface/print');
        const values = {
            rx: Number(data['rx-byte']),
            tx: Number(data['tx-byte']),
        };

        await sendToInflux({meas: 'traffic', values});
    } catch (err) {
        log.print(err);
    }
};
