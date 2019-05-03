'use strict';

const {request, influx, array} = require('utils-mad');

module.exports = async () => {
    const {body} = await request.got('http://ndr-ru.surge.sh/releases.json', {json: true});

    const values = {};
    body.forEach(elem => array.count(elem.genre.split(', '), values));

    await influx.write({meas: 'media-genres', values});
};
