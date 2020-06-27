'use strict';

const {shell, influx} = require('utils-mad');

/** */
module.exports = async () => {
    const memory = {};
    const cpu = {};
    const restarts = {};

    const uptime = await shell.run('uptime');
    const temp = await shell.run('cat /sys/class/thermal/thermal_zone0/temp');
    const disk = await shell.run('df');
    const ram = await shell.run('free -m');
    const log = await shell.run('pm2 jlist');

    JSON.parse(log).forEach(elem => {
        memory[elem.name] = elem.monit.memory;
        cpu[elem.name] = elem.monit.cpu;
        restarts[elem.name] = elem.pm2_env.restart_time;
    });

    const usage = {
        cpuLoad: Number(uptime.match(/load average: ([\d,]+),/)[1].replace(',', '.')),
        cpuTemp: Number(temp) / 1000,
        diskUsage: Number(disk.match(/\/dev\/root +\d+ +(\d+)/)[1]),
        ramUsage: Number(ram.match(/Mem: +\d+ +(\d+)/)[1]),
        uptime: uptime.match(/up(.+?),/)[1],
    };

    await influx.write([
        {meas: 'pi-apps-cpu', values: cpu},
        {meas: 'pi-apps-memory', values: memory},
        {meas: 'pi-apps-restarts', values: restarts},
        {meas: 'pi-usage', values: usage},
    ]);
};
