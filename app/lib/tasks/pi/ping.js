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
        const values = output.map(elem => {
            const [, name] = elem.match(/PING ([\w.]+) /);
            const [, time] = Number(elem.match(/time=(\d+\.\d+) /));
            return {[name]: time};
        });

        await sendToInflux({meas: 'ping', values});
    } catch (err) {
        log.print(err);
    }
};
