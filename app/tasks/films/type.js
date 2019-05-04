'use strict';

const {request, influx, array} = require('utils-mad');

module.exports = async () => {
    const {body} = await request.got('http://ndr-ru.surge.sh/releases.json', {json: true});

    const types = [];
    body.forEach(elem => elem.torrents.forEach(torrent => types.push(torrent.type)));
    const values = array.count(types);

    await influx.write({meas: 'films-type', values});
};
