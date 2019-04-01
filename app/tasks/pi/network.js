'use strict';

const {influx} = require('utils-mad');
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
        influx.write({meas: 'pi-network-speed', values: speeds}),
        influx.write({meas: 'pi-network-ping', values: ping}),
    ]);
};
