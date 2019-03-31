'use strict';

const getMikrotik = require('../../lib/mikrotik');
const {sendToInflux} = require('../../lib/utils');

module.exports = async () => {
    const [[, updates]] = await getMikrotik('/system/package/update/check-for-updates');
    console.log('::: --------------------------');
    console.log('::: my -> updates', updates);
    console.log('::: --------------------------');
    const values = {
        updates: [
            updates['installed-version'],
            updates['latest-version'],
        ].join(' / '),
    };

    await sendToInflux({meas: 'router-updates', values});
};
