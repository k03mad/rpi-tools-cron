'use strict';

const {influx} = require('utils-mad');
const {sendTmdbRequest} = require('../../lib/api');

module.exports = async () => {
    const MEDIA_COUNT = 50;
    const MIN_VOTE = 0;
    const MIN_VOTES = 20;

    const media = ['movie', 'tv'];

    const paths = media.map(elem => `trending/${elem}/week`);

    const data = {};
    await Promise.all(paths.map(async path => {
        const values = {};
        const results = await sendTmdbRequest({path, count: MEDIA_COUNT});

        results.forEach(result => {
            const {title, name, vote_average: vote, vote_count: count} = result;

            if (vote > MIN_VOTE && count > MIN_VOTES) {
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
