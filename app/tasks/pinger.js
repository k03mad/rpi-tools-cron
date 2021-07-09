'use strict';

const {cloud} = require('../../env');
const {pinger} = require('@k03mad/utils');
const {tcpPingPort} = require('tcp-ping-port');

let lastCheck;

/***/
module.exports = async () => {
    const options = [
        [cloud.domain, 22],
        [cloud.ip, 22],
    ];

    await Promise.all(options.map(async option => {
        const {online} = await tcpPingPort(...option);

        if (lastCheck !== online) {
            const status = online ? 'UP' : 'DOWN';
            await pinger.notify({text: `\`${status}\` ${option.join(':')} (from pi)`});

            lastCheck = online;
        }
    }));
};
