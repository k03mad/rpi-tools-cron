'use strict';

const psaux = require('psaux');
const {sendToInflux} = require('../../lib/utils');

module.exports = async () => {
    const ps = await psaux();
    const psCpu = {};
    const psMem = {};

    ps.forEach(elem => {
        const key = `${elem.pid}:${elem.command}`.replace(/ .+/, '').trim();
        const {cpu, mem} = elem;

        if (cpu > 0) psCpu[key] = cpu;
        if (mem > 1) psMem[key] = mem;
    });

    await Promise.all([
        sendToInflux({meas: 'pi-proc-cpu', values: psCpu}),
        sendToInflux({meas: 'pi-proc-mem', values: psMem}),
    ]);
};
