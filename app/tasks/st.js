'use strict';

const {shell, influx} = require('@k03mad/utils');

/***/
module.exports = async () => {
    const st = await shell.run('speed-test -v -j');

    const parsed = JSON.parse(st);

    const {download, upload, ping, data} = parsed;
    const {location, distance} = data.server;

    const locSantzd = location.replace('tischi', 'tishchi');

    await influx.write([
        {meas: 'pi-speed-test-mbps', values: {
            [` ↓ ${locSantzd}`]: download,
            [` ↑ ${locSantzd}`]: upload,
        }},
        {meas: 'pi-speed-test-data', values: {
            ping,
            distance,
        }},
    ]);
};
