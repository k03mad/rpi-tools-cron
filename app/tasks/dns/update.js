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

    const clear = [
        'data|',
        'hosts|',
        'master|',
        'raw.githubusercontent.com|',
        's3.amazonaws.com|',
        'bitbucket.org|',
        'gitlab.com|',
        /raw\|[\da-f]+\|/,
        /\.php\|.+/,
        /\|easylist/g,
    ];

    Object.entries(JSON.parse(data)).forEach(([key, value]) => {
        clear.forEach(elem => {
            key = key.replace(elem, '');
        });

        if (values[key]) {
            key = `dup!! ${key}`;
        }

        values[key.replace(/\|/g, '/')] = value;
    });

    await influx.write({meas: 'dns-lists', values});
};
