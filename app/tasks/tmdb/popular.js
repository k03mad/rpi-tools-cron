'use strict';

const {influx} = require('utils-mad');
const {sendTmdbRequest} = require('../../lib/api');

module.exports = async () => {
    const MEDIA_COUNT = 30;
    const media = ['movie', 'tv'];

    const paths = media.map(elem => `trending/${elem}/week`);

    const data = {};
    await Promise.all(paths.map(async path => {
        const values = {};
        const results = await sendTmdbRequest({path, count: MEDIA_COUNT});

        results.forEach((result, i) => {
            const {title, name} = result;
            values[title || name] = i + 1;
        });

        data[path.replace(/\//g, '-')] = values;
    }));

    await Promise.all(Object.keys(data).map(path => {
        const values = data[path];
        return influx.write({meas: `tmdb-place-${path}`, values});
    }));
};
