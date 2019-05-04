'use strict';

const {request, influx, array} = require('utils-mad');

module.exports = async () => {
    const {body} = await request.got('http://ndr-ru.surge.sh/releases.json', {json: true});

    const data = ['genre', 'country', 'year'];

    await Promise.all(data.map(elem => {
        const values = {};
        body.forEach(film => array.count(film[elem].split(', '), values));

        return influx.write({meas: `films-data-${elem}`, values});
    }));
};
