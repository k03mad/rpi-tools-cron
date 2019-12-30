'use strict';

const appRoot = require('app-root-path');
const {influx, array} = require('utils-mad');
const {promises: fs} = require('fs');

module.exports = async () => {
    const NAME = 'magnet-co-parser';

    const files = [
        `${NAME}/parsed/films.json`,
        `${NAME}/parsed/shows.json`,
    ];

    const [
        {timestamp: filmsTimestamp, items: filmsItems},
        {timestamp: showsTimestamp, items: showsItems},
    ] = await Promise.all(files.map(async file => {
        const data = await fs.readFile(`${appRoot}/../${file}`, 'utf8');
        return JSON.parse(data);
    }));

    const stats = {
        filmsTimings: filmsTimestamp.diffRaw,
        showsTimings: showsTimestamp.diffRaw,

        parsedStart: [
            `films ${filmsTimestamp.startTime}`,
            `shows ${showsTimestamp.startTime}`,
        ].join('</br>'),

        filmsCount: filmsItems.length,
        filmsTorrentsCount: filmsItems.flatMap(elem => elem.rutor).length,
        filmsTorrentsSeedCount: array.sum(filmsItems.flatMap(elem => elem.rutor).map(elem => Number(elem.seed))),

        showsCount: showsItems.length,
        showsTorrentsCount: showsItems.flatMap(elem => elem.rutor).length,
        showsTorrentsSeedCount: array.sum(showsItems.flatMap(elem => elem.rutor).map(elem => Number(elem.seed))),
    };

    /**
     * Получить топы торрентов
     * @param {object} opts
     * @returns {object}
     */
    const getTopFlat = ({items, firstLevel, secondLevel, split, above, one}) => {
        let output = one
            ? items.map(elem => elem[firstLevel][0])
            : items.flatMap(elem => elem[firstLevel]);

        if (secondLevel) {
            output = output.map(elem => elem ? elem[secondLevel] : '');
        }

        if (split) {
            output = output.flatMap(elem => elem.split(split));
        }

        const count = array.count(output.filter(Boolean));

        if (above) {
            const aboveCount = {};

            for (const [key, prop] of Object.entries(count)) {
                if (prop > above) {
                    aboveCount[key] = prop;
                }
            }

            return aboveCount;
        }

        return count;
    };

    const filmsTopActors = getTopFlat({items: filmsItems, firstLevel: 'photos', secondLevel: 'name', above: 3});
    const filmsTopGenres = getTopFlat({items: filmsItems, firstLevel: 'genres'});
    const filmsTopYears = getTopFlat({items: filmsItems, firstLevel: 'rutor', secondLevel: 'year', split: '-'});
    const filmsTopQuality = getTopFlat({items: filmsItems, firstLevel: 'rutor', secondLevel: 'quality'});
    const filmsTopTags = getTopFlat({items: filmsItems, firstLevel: 'rutor', secondLevel: 'tags', split: / \| |, /});
    const filmsTopCompanies = getTopFlat({items: filmsItems, firstLevel: 'companies', above: 7});
    const filmsTopCountries = getTopFlat({items: filmsItems, firstLevel: 'countries', above: 7});

    const showsTopGenres = getTopFlat({items: showsItems, firstLevel: 'genres'});
    const showsTopYears = getTopFlat({items: showsItems, firstLevel: 'rutor', secondLevel: 'year', split: '-'});
    const showsTopQuality = getTopFlat({items: showsItems, firstLevel: 'rutor', secondLevel: 'quality'});
    const showsTopTags = getTopFlat({items: showsItems, firstLevel: 'rutor', secondLevel: 'tags', split: / \| |, /});
    const showsTopEpisodes = getTopFlat({items: showsItems, firstLevel: 'rutor', secondLevel: 'episodes', one: true});
    const showsTopNetworks = getTopFlat({items: showsItems, firstLevel: 'networks'});
    const showsTopCompanies = getTopFlat({items: showsItems, firstLevel: 'companies', above: 1});
    const showsTopCountries = getTopFlat({items: showsItems, firstLevel: 'countries'});

    await Promise.all([
        influx.write({meas: 'magnet-stats', values: stats}),

        influx.write({meas: 'magnet-films-top-actors', values: filmsTopActors}),
        influx.write({meas: 'magnet-films-top-genres', values: filmsTopGenres}),
        influx.write({meas: 'magnet-films-top-years', values: filmsTopYears}),
        influx.write({meas: 'magnet-films-top-quality', values: filmsTopQuality}),
        influx.write({meas: 'magnet-films-top-tags', values: filmsTopTags}),
        influx.write({meas: 'magnet-films-top-companies', values: filmsTopCompanies}),
        influx.write({meas: 'magnet-films-top-countries', values: filmsTopCountries}),

        influx.write({meas: 'magnet-shows-top-genres', values: showsTopGenres}),
        influx.write({meas: 'magnet-shows-top-years', values: showsTopYears}),
        influx.write({meas: 'magnet-shows-top-quality', values: showsTopQuality}),
        influx.write({meas: 'magnet-shows-top-tags', values: showsTopTags}),
        influx.write({meas: 'magnet-shows-top-episodes', values: showsTopEpisodes}),
        influx.write({meas: 'magnet-shows-top-networks', values: showsTopNetworks}),
        influx.write({meas: 'magnet-shows-top-companies', values: showsTopCompanies}),
        influx.write({meas: 'magnet-shows-top-countries', values: showsTopCountries}),
    ]);
};
