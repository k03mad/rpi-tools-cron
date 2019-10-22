'use strict';

const appRoot = require('app-root-path');
const {promises: fs} = require('fs');
const {repo, influx} = require('utils-mad');

module.exports = async () => {
    const NAME = 'magnet-co-parser';
    await repo.run(NAME, 'start');

    const files = [
        `${NAME}/parsed/films.json`,
        `${NAME}/parsed/shows.json`,
    ];

    const [films, shows] = await Promise.all(files.map(async file => {
        const data = await fs.readFile(`${appRoot}/../${file}`, 'utf8');
        return JSON.parse(data).timestamp.diffRaw;
    }));

    await influx.write({meas: 'parse-stats', values: {films, shows}});
};
