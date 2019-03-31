'use strict';

const {sendToInflux} = require('../../lib/utils');
const {shell} = require('utils-mad');

module.exports = async () => {
    const list = await shell.run([
        'sudo apt-get update > /dev/null',
        'sudo apt-get -u -V upgrade',
    ]);

    await sendToInflux({meas: 'pi-update', values: {updates: list}});
};
