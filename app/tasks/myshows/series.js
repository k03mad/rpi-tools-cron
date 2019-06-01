'use strict';

const {influx} = require('utils-mad');
const {sendMyshowsRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendMyshowsRequest('profile.Shows');
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
