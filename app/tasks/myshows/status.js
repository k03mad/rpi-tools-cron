'use strict';

const {influx, array} = require('utils-mad');
const {sendMyshowsRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendMyshowsRequest('profile.Shows');
    const watchStatus = array.count(body.map(elem => elem.watchStatus));
    const showsStatus = array.count(body.map(elem => elem.show.status));

    await Promise.all([
        influx.write({meas: 'myshows-status-watch', values: watchStatus}),
        influx.write({meas: 'myshows-status-shows', values: showsStatus}),
    ]);
};
