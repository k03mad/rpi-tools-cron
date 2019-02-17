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
        const output = await Promise.all(hosts.map(host => shell.run(`ping ${host} -c 1`)));
        const data = output.map(elem => {
            const [, name] = elem.match(/PING ([\w.]+) /);
            const [, time] = elem.match(/time=(\d+\.\d+) /);
            return {[name]: Number(time)};
        });

        await Promise.all(data.map(values => sendToInflux({meas: 'ping', values})));
    } catch (err) {
        log.print(err);
    }
};
