'use strict';

const {sendToInflux} = require('../../lib/utils');
const {shell} = require('utils-mad');

module.exports = async () => {
    const list = await shell.run([
        'sudo apt update > /dev/null',
        'apt list --upgradable',
    ]);

    await sendToInflux({meas: 'pi-update', values: {updates: list}});
};
