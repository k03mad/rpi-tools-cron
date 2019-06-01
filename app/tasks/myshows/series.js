'use strict';

const {myshows, influx} = require('utils-mad');

module.exports = async () => {
    const body = await myshows.get({method: 'profile.Shows'});
    const watching = body.filter(elem => elem.watchStatus === 'watching');

    const values = {};
    watching.forEach(elem => {
        const remaining = elem.totalEpisodes - elem.watchedEpisodes;

        if (remaining > 0) {
            values[elem.show.title] = remaining;
        }
    });

    await influx.write({meas: 'myshows-series', values});
};
