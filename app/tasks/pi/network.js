'use strict';

const {sendToInflux} = require('../../lib/utils');
const {speedTest} = require('../../lib/utils');

module.exports = async () => {
    const data = await speedTest();

    const speeds = {
        download: data.speeds.download,
        upload: data.speeds.upload,
    };

    const ping = {
        [data.server.host]: data.server.ping,
    };

    await Promise.all([
        sendToInflux({meas: 'pi-network-speed', values: speeds}),
        sendToInflux({meas: 'pi-network-ping', values: ping}),
    ]);
};
