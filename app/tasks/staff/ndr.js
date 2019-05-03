'use strict';

const {request, influx} = require('utils-mad');

module.exports = async () => {
    const values = {};

    const {body} = await request.got('http://ndr-ru.surge.sh/releases.json', {json: true});
    body.forEach(elem => {
        values[elem.nameRU || elem.nameOriginal] = Number(elem.ratingKP);
    });

    await influx.write({meas: 'staff-ndr', values});
};
