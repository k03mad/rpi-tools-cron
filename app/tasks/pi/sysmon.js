'use strict';

const {shell, influx} = require('utils-mad');

module.exports = async () => {
    const sysinfos = await shell.run('pm2 sysinfos');
    const replaced = sysinfos.replace(/'/g, '"').replace(/ (\w*?): /g, '"$1":');
    const {cpu, mem, fd, storage, connections, network, processes} = JSON.parse(replaced);

    const statsUsage = {
        'cpu usage': Number(cpu.usage),
        'cpu temp': cpu.temperature,

        'fd opened': fd.opened,
        'fd max': fd.max,

        'storage io read': storage.io.read,
        'storage io write': storage.io.write,

        'connections': connections.length,
    };

    const storSize = {};
    const storUsed = {};
    const storUsage = {};
    storage.filesystems.forEach(elem => {
        storSize[elem.fs] = elem.size;
        storUsed[elem.fs] = elem.used;
        storUsage[elem.fs] = elem.use;
    });

    const cpuProc = {};
    processes.cpu_sorted.forEach((elem, i) => {
        cpuProc[`${i} ${elem.name}`] = elem.cpu;
    });

    const memProc = {};
    processes.mem_sorted.forEach((elem, i) => {
        memProc[`${i} ${elem.name}`] = elem.memory;
    });

    const memUsage = {};
    Object.entries(mem).forEach(([key, value]) => {
        memUsage[key] = Number(value);
    });

    const netUsage = {};
    Object.entries(network).forEach(([key, value]) => {
        netUsage[key] = Number(value);
    });

    await Promise.all([
        influx.write({meas: 'pi-sysmon-stats-usage', values: statsUsage}),
        influx.write({meas: 'pi-sysmon-stor-size', values: storSize}),
        influx.write({meas: 'pi-sysmon-stor-used', values: storUsed}),
        influx.write({meas: 'pi-sysmon-stor-usage', values: storUsage}),
        influx.write({meas: 'pi-sysmon-cpu-proc', values: cpuProc}),
        influx.write({meas: 'pi-sysmon-mem-proc', values: memProc}),
        influx.write({meas: 'pi-sysmon-mem-usage', values: memUsage}),
        influx.write({meas: 'pi-sysmon-net-usage', values: netUsage}),
    ]);
};
