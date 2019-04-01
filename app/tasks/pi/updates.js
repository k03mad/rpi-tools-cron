'use strict';

const {shell, influx} = require('utils-mad');

module.exports = async () => {
    const values = {
        updates: await shell.run([
            'sudo apt-get update > /dev/null',
            'sudo apt-get -u -V upgrade',
        ]),
    };

    await influx.write({meas: 'pi-update', values});
};
