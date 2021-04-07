'use strict';

const stripAnsi = require('strip-ansi');
const {shell, influx} = require('@k03mad/utils');

/***/
module.exports = async () => {
    const st = await shell.run('speed-cloudflare-cli');
    const data = stripAnsi(st)
        .split('\n')
        .map(elem => elem.trim());

    const location = data[0].replace('Server location: ', '');
    const latency = data[2].replace(/Latency: | ms/g, '');
    const jitter = data[3].replace(/Jitter: | ms/g, '');
    const download = data[9].replace(/Download speed: | Mbps/g, '');
    const upload = data[10].replace(/Upload speed: | Mbps/g, '');

    await influx.write([
        {meas: 'pi-speed-test-mbps', values: {
            [` ↓ ${location}`]: Number(download),
            [` ↑ ${location}`]: Number(upload),
        }},
        {meas: 'pi-speed-test-data', values: {
            latency: Number(latency),
            jitter: Number(jitter),
        }},
    ]);
};
