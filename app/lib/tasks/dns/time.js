'use strict';

const {log} = require('utils-mad');
const {sendToInflux, sendPiholeRequest} = require('../../utils');

/**
 * Send dns clients queries by time
 */
module.exports = async () => {
    const SEND_ITEMS = 10;

    try {
        const {clients, over_time} = await sendPiholeRequest({overTimeDataClients: '', getClientNames: ''});

        const data = [];
        const stamps = [];
        const times = Object.keys(over_time);

        for (let i = 0; i < SEND_ITEMS; i++) {
            const values = {};
            const key = times[times.length - (i + 1)];
            clients.forEach((elem, index) => {
                values[elem.name] = over_time[key][index];
            });

            // microseconds
            stamps.push(Number(key) * 1000000000);
            data.push(values);
        }

        await Promise.all(stamps.map(async (timestamp, index) => {
            await sendToInflux({meas: 'timeline', values: data[index], timestamp});
        }));
    } catch (err) {
        log.print(err);
    }
};
