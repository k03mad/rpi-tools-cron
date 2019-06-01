'use strict';

const {influx, myshows} = require('utils-mad');

module.exports = async () => {
    const {stats: values} = await myshows.get({method: 'profile.Get'});
    await influx.write({meas: 'myshows-stats', values});
};
