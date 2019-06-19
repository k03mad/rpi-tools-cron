'use strict';

const {influx, array, myshows} = require('utils-mad');

module.exports = async () => {
    const body = await myshows.get({method: 'profile.Shows'});
    const values = array.count(body.map(elem => elem.watchStatus));

    await influx.write({meas: 'myshows-status-watch', values});
};
