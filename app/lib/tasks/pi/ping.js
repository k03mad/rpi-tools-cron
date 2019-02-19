'use strict';

const {log, shell} = require('utils-mad');
const {sendToInflux} = require('../../utils');

/**
 * Get ping time
 */
module.exports = async () => {
    const hosts = [
        'yandex.ru',
        'google.com',
    ];

    try {
        const values = {};
        await Promise.all(hosts.map(async host => {
            const data = await shell.run(`ping ${host} -c 1`);
            const [, name] = data.match(/PING ([\w.]+) /);
            const [, time] = data.match(/time=(\d+\.\d+) /);
            values[name] = Number(time);
        }));

        await sendToInflux({meas: 'ping', values});
    } catch (err) {
        log.print(err);
    }
};
