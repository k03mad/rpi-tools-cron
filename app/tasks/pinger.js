'use strict';

const {cloud, tg} = require('../../env');
const {tcpPingPort} = require('tcp-ping-port');
const {telegram} = require('@k03mad/utils');

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
            await telegram.sendMessage({text: `RPi PING: \`${status}\` ${option.join(':')}`}, tg.pinger);

            lastCheck = online;
        }
    }));
};
