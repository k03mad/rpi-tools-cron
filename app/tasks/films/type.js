'use strict';

const {influx, array} = require('utils-mad');
const {sendChsvRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendChsvRequest();

    const values = {};
    body.forEach(elem => elem.torrents.forEach(torrent => array.count(torrent.type, values)));

    await influx.write({meas: 'films-type', values});
};
