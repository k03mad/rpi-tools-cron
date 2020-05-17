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

    // eslint-disable-next-line jsdoc/require-jsdoc
    const getTopFlat = ({items, firstLevel, secondLevel, split, splitLast, one, replace}) => {
        let output = one
            ? items.map(elem => elem[firstLevel][0])
            : items.flatMap(elem => elem[firstLevel]);

        output = output.filter(Boolean);

        if (secondLevel) {
            output = output
                .map(elem => elem[secondLevel])
                .filter(Boolean);
        }

        if (split) {
            output = splitLast
                ? output.map(elem => elem.split(split).pop())
                : output.flatMap(elem => elem.split(split));
        }

        if (replace) {
            output = output.map(elem => elem.replace(replace.re, replace.str));
        }

        return array.count(output);
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
            values: getTopFlat({items: filmsItems, firstLevel: 'rutor', secondLevel: 'year', one: true, split: '-', splitLast: true}),
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
            values: getTopFlat({items: filmsItems, firstLevel: 'countries', replace: {re: ' (Китайская Народная Республика)', str: ''}}),
        },
        // shows
        {
            meas: 'magnet-shows-top-years',
            values: getTopFlat({items: showsItems, firstLevel: 'rutor', secondLevel: 'year', one: true, split: '-'}),
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
            values: getTopFlat({items: showsItems, firstLevel: 'rutor', secondLevel: 'episodes', one: true, replace: {re: /(.*?) .+/, str: '$1'}}),
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

    await influx.write(counters);
};
