'use strict';

const {influx, array, myshows} = require('utils-mad');

module.exports = async () => {
    const body = await myshows.get({method: 'profile.Shows'});
    const watchStatus = array.count(body.map(elem => elem.watchStatus));
    const showsStatus = array.count(body.map(elem => elem.show.status));

    await Promise.all([
        influx.write({meas: 'myshows-status-watch', values: watchStatus}),
        influx.write({meas: 'myshows-status-shows', values: showsStatus}),
    ]);
};
