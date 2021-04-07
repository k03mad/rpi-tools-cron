'use strict';

const {shell, influx} = require('@k03mad/utils');

/***/
module.exports = async () => {
    const st = await shell.run('speed-test -v');
    const matched = st.match(/ping\s+(?<ping>\d+)[\S\s]+download\s+(?<download>\d+)[\S\s]+upload\s+(?<upload>\d+)[\S\s]+location\s+(?<location>.+) [\S\s]+distance\s+(?<distance>[\d.]+)/i);

    if (!matched) {
        throw new Error(`Speed-Test results doesn't match to regexp\n\n${st}`);
    }

    const {download, upload, ping, location, distance} = matched.groups;

    const locSantzd = location.replace('tischi', 'tishchi');

    await influx.write([
        {meas: 'pi-speed-test-mbps', values: {
            [` ↓ ${locSantzd}`]: Number(download),
            [` ↑ ${locSantzd}`]: Number(upload),
        }},
        {meas: 'pi-speed-test-data', values: {
            ping: Number(ping),
            distance: Number(distance),
        }},
    ]);
};
