'use strict';

const converter = require('i18n-iso-countries');
const pMap = require('p-map');
const {influx, next} = require('utils-mad');

const mapValues = (
    data, {key = 'name', value = 'queries'} = {},
) => Object.fromEntries(
    data.map(elem => [elem[key], elem[value]]),
);

/***/
module.exports = async () => {
    const concurrency = 3;
    const topCountriesLen = 15;
    const topCountriesNameMaxLen = 15;

    const lists = await next.get('', {route: 'privacy'});

    const [
        topCountries,
        gafam,
        dnssec,
        secure,
        topRoot,
        topDevices,
        topLists,
        topDomainsBlocked,
        topDomainsResolved,
        counters,
        queriesPerDay,
        ips,
    ] = await pMap([
        'traffic_destination_countries',
        'gafam',
        'dnssec',
        'secure_dns',
        'top_root_domains',
        'top_devices',
        'top_lists',
        'top_domains/blocked',
        'top_domains/resolved',
        'counters',
        'queries_chart',
        'top_client_ips',
    ], req => next.get(req), {concurrency});

    topDomainsBlocked.forEach(elem => {
        elem.queries = -elem.queries;
    });

    topLists.forEach(list => {
        list.id = lists.blocklists.find(elem => elem.name === list.name).id;
    });

    const topCountriesToValues = Object.fromEntries(
        Object
            .entries(topCountries)
            .map(elem => {
                let name = converter.getName(elem[0], 'en');

                if (name.length > topCountriesNameMaxLen) {
                    name = converter.alpha2ToAlpha3(elem[0]);
                }

                return [name, elem[1].queries];
            })
            .sort((a, b) => b[1] - a[1])
            .slice(0, topCountriesLen),
    );

    await influx.write([
        {meas: 'next-counters', values: counters},
        {meas: 'next-dnssec', values: dnssec},
        {meas: 'next-gafam', values: mapValues(gafam, {key: 'company'})},
        {meas: 'next-lists', values: mapValues(lists.blocklists, {key: 'id', value: 'entries'})},
        {meas: 'next-secure', values: secure},
        {meas: 'next-top-countries', values: topCountriesToValues},
        {meas: 'next-top-devices', values: mapValues(topDevices)},
        {meas: 'next-top-domains-blocked', values: mapValues(topDomainsBlocked)},
        {meas: 'next-top-domains-resolved', values: mapValues(topDomainsResolved)},
        {meas: 'next-top-ips', values: mapValues(ips, {key: 'ip'})},
        {meas: 'next-top-lists', values: mapValues(topLists, {key: 'id'})},
        {meas: 'next-top-root', values: mapValues(topRoot)},
    ]);

    for (const data of queriesPerDay) {
        await influx.write({
            meas: 'next-queries',
            values: {queries: data.queries, blocked: data.blockedQueries},
            timestamp: `${data.name}000000000`,
        });
    }
};
