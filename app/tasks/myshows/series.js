'use strict';

const {myshows, influx} = require('utils-mad');

/** */
module.exports = async () => {
    const body = await myshows.watch();

    const values = {};
    body.forEach(elem => {
        values[elem.show.title] = elem.totalEpisodes - elem.watchedEpisodes;
    });

    await influx.write({meas: 'myshows-series', values});
};
