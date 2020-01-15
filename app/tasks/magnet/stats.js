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

    const counters = [
        // common
        {
            meas: 'magnet-stats',
            values: {
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
            },
        },
        // films
        {
            meas: 'magnet-films-top-years',
            values: getTopFlat({items: filmsItems, firstLevel: 'rutor', secondLevel: 'year', split: '-'}),
        },
        {
            meas: 'magnet-films-top-quality',
            values: getTopFlat({items: filmsItems, firstLevel: 'rutor', secondLevel: 'quality'}),
        },
        {
            meas: 'magnet-films-top-tags',
            values: getTopFlat({items: filmsItems, firstLevel: 'rutor', secondLevel: 'tags', split: / \| |, /}),
        },
        {
            meas: 'magnet-films-top-countries',
            values: getTopFlat({items: filmsItems, firstLevel: 'countries', above: 2}),
        },
        // shows
        {
            meas: 'magnet-shows-top-years',
            values: getTopFlat({items: showsItems, firstLevel: 'rutor', secondLevel: 'year', split: '-'}),
        },
        {
            meas: 'magnet-shows-top-quality',
            values: getTopFlat({items: showsItems, firstLevel: 'rutor', secondLevel: 'quality'}),
        },
        {
            meas: 'magnet-shows-top-tags',
            values: getTopFlat({items: showsItems, firstLevel: 'rutor', secondLevel: 'tags', split: / \| |, /}),
        },
        {
            meas: 'magnet-shows-top-episodes',
            values: getTopFlat({items: showsItems, firstLevel: 'rutor', secondLevel: 'episodes', one: true}),
        },
        {
            meas: 'magnet-shows-top-networks',
            values: getTopFlat({items: showsItems, firstLevel: 'networks'}),
        },
        {
            meas: 'magnet-shows-top-countries',
            values: getTopFlat({items: showsItems, firstLevel: 'countries'}),
        },
    ];

    for (const data of counters) {
        await influx.write(data);
    }
};
