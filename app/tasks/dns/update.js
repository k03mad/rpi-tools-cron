'use strict';

const appRoot = require('app-root-path');
const {influx, repo, array} = require('utils-mad');
const {promises: fs} = require('fs');
const {sendAdgRequest} = require('../../lib/api');

module.exports = async () => {
    const REPO = 'adblock-hosts-list';
    const file = `${REPO}/output/stats.json`;

    await repo.run(REPO, 'deploy');
    await sendAdgRequest('filtering/refresh', {method: 'POST', json: false});

    const apiData = await sendAdgRequest('filtering/status');
    const apiHostsSum = array.sum(apiData.filters.map(elem => elem.rules_count));

    const fileData = JSON.parse(await fs.readFile(`${appRoot}/../${file}`, 'utf8'));

    const listsValues = {};

    Object.entries(fileData.results).forEach(([key, value]) => {
        if (listsValues[key]) {
            key = `dup!! ${key}`;
        }

        listsValues[key] = value;
    });

    await Promise.all([
        influx.write({meas: 'dns-lists', values: listsValues}),
        influx.write({meas: 'dns-lists-count', values: {api: apiHostsSum, file: fileData.uniqcount, white: fileData.whitelisted}}),
    ]);
};
