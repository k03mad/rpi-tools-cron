'use strict';

const {shell, influx} = require('utils-mad');

/** */
module.exports = async () => {
    const apt = await shell.run([
        'sudo apt-get update',
        'sudo apt-get upgrade -u -s',
    ]);

    const updates = apt
        .split('\n')
        .filter(elem => elem.includes('Inst'))
        .length;

    await influx.write({meas: 'pi-update', values: {updates}});
};
