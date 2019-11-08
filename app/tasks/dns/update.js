'use strict';

const appRoot = require('app-root-path');
const {influx, repo} = require('utils-mad');
const {promises: fs} = require('fs');
const {sendAdgRequest} = require('../../lib/api');

module.exports = async () => {
    const REPO = 'adblock-hosts-list';
    const file = `${REPO}/output/stats.json`;

    await repo.run(REPO, 'deploy');
    await sendAdgRequest('filtering/refresh', {method: 'POST', json: false});

    const apiData = await sendAdgRequest('filtering/status');
    const fileData = JSON.parse(await fs.readFile(`${appRoot}/../${file}`, 'utf8'));

    const listsValues = {};

    Object.entries(fileData.results).forEach(([key, value]) => {
        listsValues[key] = value;
    });

    await Promise.all([
        influx.write({meas: 'dns-lists', values: listsValues}),
        influx.write({meas: 'dns-lists-count', values: {
            api: apiData.filters[0].rules_count,
            fileHosts: fileData.hostscount,
            fileDomains: fileData.domainscount,
            white: fileData.whitelisted,
        }}),
    ]);
};
