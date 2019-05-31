'use strict';

const {influx} = require('utils-mad');
const {sendPiholeRequest} = require('../../lib/api');

module.exports = async () => {
    const DHCP_STATIC_IP = 150;
    const values = {};

    const {network} = await sendPiholeRequest({network: ''}, '/admin/api_db.php');

    for (const elem of network) {
        const {numQueries, ip, name} = elem;

        if (ip.split('.').pop() < DHCP_STATIC_IP && numQueries > 0) {
            values[`${name}|${ip}`] = numQueries;
        }
    }

    await influx.write({meas: 'dns-network', values});
};
