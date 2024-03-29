'use strict';

const globby = require('globby');
const hasha = require('hasha');
const os = require('os');
const path = require('path');
const {shell, influx} = require('@k03mad/utils');

/***/
module.exports = async () => {
    const memory = {};
    const cpu = {};
    const restarts = {};
    const wifiSignal = {};

    const uptime = await shell.run('uptime');
    const temp = await shell.run('cat /sys/class/thermal/thermal_zone0/temp');
    const disk = await shell.run('df');
    const ram = await shell.run('free -m');
    const log = await shell.run('pm2 jlist');
    const networks = await shell.run('sudo iwlist wlan0 scan');
    const cacheFiles = await globby(path.join(os.tmpdir(), hasha('').slice(0, 10)));

    networks
        .split(/Cell \d+/)
        .map(elem => elem.match(/Channel:(?<channel>.+)[\S\s]+Signal level=(?<signal>.+) dBm[\S\s]+ESSID:"(?<essid>.+)"/))
        .filter(Boolean)
        .forEach(({groups}) => {
            wifiSignal[groups.essid] = Number(groups.signal);
        });

    JSON.parse(log).forEach(elem => {
        memory[elem.name] = elem.monit.memory;
        cpu[elem.name] = elem.monit.cpu;
        restarts[elem.name] = elem.pm2_env.restart_time;
    });

    const [, ramTotal, ramUsage] = ram
        .match(/Mem: +(\d+) +(\d+)/)
        .map(Number);

    const usage = {
        ramUsage,
        ramTotal,
        cpuLoad: Number(uptime.match(/load average: (\d\.\d\d)/)[1].replace(',', '.')),
        cpuTemp: Number(temp) / 1000,
        diskUsage: Number(disk.match(/\/dev\/root +\d+ +(\d+)/)[1]),
        uptime: `Uptime: ${uptime.match(/up(.+?),/)[1]}`,
        nodeCache: cacheFiles.length,
    };

    await influx.write([
        {meas: 'pi-node-cpu', values: cpu},
        {meas: 'pi-node-memory', values: memory},
        {meas: 'pi-node-restarts', values: restarts},
        {meas: 'pi-usage', values: usage},
        {meas: 'pi-wifi-signal', values: wifiSignal},
    ]);
};
