'use strict';

const {shell, influx} = require('utils-mad');

module.exports = async () => {
    const log = await shell.run('pm2 jlist');

    const memory = {};
    const cpu = {};
    const restarts = {};

    JSON.parse(log).forEach(elem => {
        memory[elem.name] = elem.monit.memory;
        cpu[elem.name] = elem.monit.cpu;
        restarts[elem.name] = elem.pm2_env.restart_time;
    });

    const counters = [
        {meas: 'pi-apps-memory', values: memory},
        {meas: 'pi-apps-cpu', values: cpu},
        {meas: 'pi-apps-restarts', values: restarts},
    ];

    for (const data of counters) {
        await influx.write(data);
    }
};
