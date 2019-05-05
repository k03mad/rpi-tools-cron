'use strict';

const {influx} = require('utils-mad');
const {sendNdrRequest} = require('../../lib/api');

module.exports = async () => {
    const body = await sendNdrRequest();

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
        influx.write({meas: 'films-ratings-kp', values: kp}),
        influx.write({meas: 'films-ratings-imdb', values: imdb}),
    ]);
};
