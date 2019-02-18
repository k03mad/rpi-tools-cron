'use strict';

const {log, shell} = require('utils-mad');
const {sendToInflux} = require('../../utils');

/**
 * Get pi cpu usage
 */
module.exports = async () => {
    try {
        const stat = await shell.run('mpstat 1 1');
        const idle = stat.split('\n')[3].split(' ').pop();
        const values = {usage: 100 - Number(idle.replace(',', '.'))};

        await sendToInflux({meas: 'cpu', values});
    } catch (err) {
        log.print(err);
    }
};
