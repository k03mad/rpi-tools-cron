'use strict';

const {influx, array} = require('utils-mad');
const {sendNdrRequest} = require('../../lib/utils');

module.exports = async () => {
    const body = await sendNdrRequest();

    const values = {};
    body.forEach(elem => elem.torrents.forEach(torrent => array.count(torrent.type, values)));

    await influx.write({meas: 'films-type', values});
};
