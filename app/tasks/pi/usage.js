'use strict';

const {shell, influx} = require('utils-mad');

/** */
module.exports = async () => {
    const [uptime, temp, disk, ram] = await Promise.all([
        shell.run('uptime'),
        shell.run('cat /sys/class/thermal/thermal_zone0/temp'),
        shell.run('df'),
        shell.run('free -m'),
    ]);

    const values = {
        cpuLoad: Number(uptime.match(/load average: ([\d,]+),/)[1].replace(',', '.')),
        cpuTemp: Number(temp) / 1000,
        diskUsage: Number(disk.match(/\/dev\/root +\d+ +(\d+)/)[1]),
        ramUsage: Number(ram.match(/Mem: +\d+ +(\d+)/)[1]),
        uptime: uptime.match(/up(.+?),/)[1],
    };

    await influx.write({meas: 'pi-usage', values});
};
