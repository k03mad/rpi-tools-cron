'use strict';

const {getAirVisualData} = require('../../lib/api');
const {influx} = require('utils-mad');

module.exports = async () => {
    const {data} = await getAirVisualData();
    const {weather, pollution} = data.current;

    const values = {
        temperature: weather.tp,
        pressure: weather.pr * 0.75006375541921,
        humidity: weather.hu,
        wind: weather.ws,
        pollution: pollution.aqius,
    };

    await influx.write({meas: 'weather-moscow', values});
};
