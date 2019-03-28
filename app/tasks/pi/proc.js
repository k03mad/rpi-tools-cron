'use strict';

const psaux = require('psaux');
const {sendToInflux} = require('../../lib/utils');

module.exports = async () => {
    const ps = await psaux();
    const psCpu = {};
    const psMem = {};

    ps.forEach(({cpu, mem, command}) => {
        const proc = command.replace(/ .+/, '').trim();

        if (cpu > 0) psCpu[proc] = psCpu[proc] + cpu || cpu;
        if (mem > 1) psMem[proc] = psMem[proc] + mem || mem;
    });

    await Promise.all([
        sendToInflux({meas: 'pi-proc-cpu', values: psCpu}),
        sendToInflux({meas: 'pi-proc-mem', values: psMem}),
    ]);
};
