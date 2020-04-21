'use strict';

const {influx, mikrotik} = require('utils-mad');

module.exports = async () => {
    const interfaceSpeed = {};

    const [
        [usage],
        [, updates],
        ...monitorTraffic
    ] = await mikrotik.write([
        ['/system/resource/print'],
        ['/system/package/update/check-for-updates'],
        ...['wan1', 'ether1', 'ether2', 'ether3', 'ether4', 'pptp1', 'wlan1', 'wlan2']
            .map(elem => ['/interface/monitor-traffic', `=interface=${elem}`, '=once']),
    ]);

    const health = {
        mem: Math.round((Number(usage['total-memory']) - Number(usage['free-memory'])) * 1e-6),
        hdd: Math.round((Number(usage['total-hdd-space']) - Number(usage['free-hdd-space'])) * 1e-6),
        cpu: Number(usage['cpu-load']),
        uptime: usage.uptime,
        updates: `current: ${updates['installed-version']}</br>latest: ${updates['latest-version']}`,
    };

    monitorTraffic.forEach(([obj]) => {
        interfaceSpeed[`${obj.name}_rx`] = Number(obj['rx-bits-per-second']);
        interfaceSpeed[`${obj.name}_tx`] = Number(obj['tx-bits-per-second']);
    });

    await influx.write([
        {meas: 'router-interface-speed', values: interfaceSpeed},
        {meas: 'router-usage', values: health},
    ]);
};
