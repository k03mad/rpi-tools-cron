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

    await Promise.all([
        influx.write({meas: 'pi-apps-memory', values: memory}),
        influx.write({meas: 'pi-apps-cpu', values: cpu}),
        influx.write({meas: 'pi-apps-restarts', values: restarts}),
    ]);
};
