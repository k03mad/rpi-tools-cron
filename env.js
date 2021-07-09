'use strict';

module.exports = {
    cloud: {
        domain: process.env.CLOUD_DOMAIN,
        ip: process.env.CLOUD_IP,
    },
    tg: {
        pinger: process.env.TELEGRAM_PINGER_BOT,
    },
};
