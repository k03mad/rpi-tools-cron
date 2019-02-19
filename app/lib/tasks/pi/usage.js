'use strict';

const {log, shell} = require('utils-mad');
const {sendToInflux} = require('../../utils');

/**
 * Get pi usage
 */
module.exports = async () => {
    try {
        const [load, temp, disk, ram] = await Promise.all([
            shell.run('mpstat 1 1'),
            shell.run('cat /sys/class/thermal/thermal_zone0/temp'),
            shell.run('df'),
            shell.run('free -m'),
        ]);

        const cpuIdle = load.split('\n')[3].split(' ').pop();

        const values = {
            cpuLoad: 100 - Number(cpuIdle.replace(',', '.')),
            cpuTemp: Number(temp) / 1000,
            diskUsage: Number(disk.match(/\/dev\/root +\d+ +(\d+)/)[1]),
            ramUsage: Number(ram.match(/Mem: +\d+ +(\d+)/)[1]),
        };

        await sendToInflux({meas: 'pi', values});
    } catch (err) {
        log.print(err);
    }
};
