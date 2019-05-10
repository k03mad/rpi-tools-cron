'use strict';

const {influx} = require('utils-mad');
const {sendTmdbRequest} = require('../../lib/api');

module.exports = async () => {
    const MEDIA_COUNT = 30;
    const media = ['movie', 'tv'];

    const paths = [];
    media.forEach(elem => {
        paths.push(`trending/${elem}/week`, `${elem}/popular`);
    });

    const data = {};
    await Promise.all(paths.map(async path => {
        const values = {};
        const results = await sendTmdbRequest({path, count: MEDIA_COUNT});

        results.forEach(result => {
            const {title, name, vote_average: vote} = result;

            if (vote > 0) {
                values[title || name] = vote;
            }
        });

        data[path.replace(/\//g, '-')] = values;
    }));

    await Promise.all(Object.keys(data).map(path => {
        const values = data[path];
        return influx.write({meas: `tmdb-rate-${path}`, values});
    }));
};
