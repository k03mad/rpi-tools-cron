'use strict';

const appRoot = require('app-root-path');
const {influx} = require('utils-mad');
const {promises: fs} = require('fs');

module.exports = async () => {
    const REPO = 'magnet-co-parser';
    const files = [
        `${REPO}/parsed/films.json`,
        `${REPO}/parsed/shows.json`,
    ];

    const [films, shows] = await Promise.all(files.map(async file => {
        const data = await fs.readFile(`${appRoot}/../${file}`, 'utf8');
        return JSON.parse(data).timestamp.diffRaw;
    }));

    await influx.write({meas: 'parse-stats', values: {films, shows}});
};
