'use strict';

const {influx} = require('utils-mad');
const {sendChsvRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendChsvRequest();

    const kp = {};
    const imdb = {};

    const MIN_RATE = 0;

    body.forEach(elem => {
        const kpRate = Number(elem.ratingKP);
        const imdbRate = Number(elem.ratingIMDb);
        const name = elem.nameRU || elem.nameOriginal;

        if (kpRate > MIN_RATE) {
            kp[name] = kpRate;
        }

        if (imdbRate > MIN_RATE) {
            imdb[name] = imdbRate;
        }
    });

    await Promise.all([
        influx.write({meas: 'films-ratings-kp', values: kp}),
        influx.write({meas: 'films-ratings-imdb', values: imdb}),
    ]);
};
