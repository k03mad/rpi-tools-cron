'use strict';

const appRoot = require('app-root-path');
const {influx, shell} = require('utils-mad');
const {promises: fs} = require('fs');

module.exports = async () => {
    const REPO = 'adblock-hosts-list';
    const file = `${REPO}/output/stats.json`;

    await shell.script(REPO, 'deploy && pihole -g');
    const data = await fs.readFile(`${appRoot}/../${file}`, 'utf8');

    const values = {};

    Object.entries(JSON.parse(data)).forEach(([key, value]) => {
        if (values[key]) {
            key = `dup!! ${key}`;
        }

        values[key] = value;
    });

    await influx.write({meas: 'dns-lists', values});
};
