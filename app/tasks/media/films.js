'use strict';

const {request, influx} = require('utils-mad');

module.exports = async () => {
    const {body} = await request.got('http://ndr-ru.surge.sh/releases.json', {json: true});

    const kp = {};
    const imdb = {};

    const MIN_RATE = 0;

    body.forEach(elem => {
        const kpRate = Number(elem.ratingKP);
        const ImdbRate = Number(elem.ratingIMDb);
        const name = elem.nameRU || elem.nameOriginal;

        if (kpRate > MIN_RATE) {
            kp[name] = kpRate;
        }

        if (ImdbRate > MIN_RATE) {
            imdb[name] = ImdbRate;
        }
    });

    await Promise.all([
        influx.write({meas: 'media-films-kp', values: kp}),
        influx.write({meas: 'media-films-imdb', values: imdb}),
    ]);
};
