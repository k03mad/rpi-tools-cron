'use strict';

const {request, influx} = require('utils-mad');

module.exports = async () => {
    const values = {};

    const {body} = await request.got('http://ndr-ru.surge.sh/releases.json', {json: true});
    body.forEach(elem => {
        const kpRate = Number(elem.ratingKP);

        if (kpRate >= 7) {
            values[elem.nameRU || elem.nameOriginal] = kpRate;
        }
    });

    await influx.write({meas: 'staff-ndr', values});
};
