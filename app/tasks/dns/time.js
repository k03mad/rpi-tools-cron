'use strict';

const {influx} = require('utils-mad');
const {sendPiholeRequest} = require('../../lib/utils');

module.exports = async () => {
    const SEND_ITEMS = 10;

    const {clients, over_time} = await sendPiholeRequest({overTimeDataClients: '', getClientNames: ''});

    const data = [];
    const stamps = [];
    const times = Object.keys(over_time);

    for (let i = 0; i < SEND_ITEMS; i++) {
        const values = {};
        const time = times[times.length - (i + 1)];

        if (time) {
            clients.forEach(({name, ip}, index) => {
                const blocked = over_time[time][index];

                if (blocked) {
                    values[name || ip] = blocked;
                }
            });

            // microseconds
            stamps.push(Number(time) * 1000000000);

            if (Object.keys(values).length > 0) {
                data.push(values);
            }
        }
    }

    await Promise.all(data.map(
        (values, index) => influx.write({meas: 'dns-time', values, timestamp: stamps[index]})
    ));
};
