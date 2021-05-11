'use strict';

const {request, influx} = require('@k03mad/utils');
const {tokens} = require('../../env');

/***/
module.exports = async () => {
    const {body} = await request.got('https://api-invest.tinkoff.ru/openapi/portfolio', {
        headers: {
            Authorization: `Bearer ${tokens.tinkoff}`,
        },
    });

    const tickers = {};
    const balance = {};

    body.payload.positions.forEach(({
        instrumentType, ticker, lots,
        expectedYield, averagePositionPrice,
    }) => {
        if (instrumentType === 'Etf') {
            if (!tickers[`yield-${expectedYield.currency}`]) {
                tickers[`yield-${expectedYield.currency}`] = {[ticker]: {}};
            }

            if (!balance[averagePositionPrice.currency]) {
                balance[averagePositionPrice.currency] = 0;
            }

            tickers[`yield-${expectedYield.currency}`][ticker] = expectedYield.value;
            balance[averagePositionPrice.currency] += (lots * averagePositionPrice.value) + expectedYield.value;
        }
    });

    const formatted = [
        ...Object
            .entries(tickers)
            .map(([meas, values]) => ({meas: `tinkoff-${meas}`, values})),

        {meas: 'tinkoff-balance', values: balance},
    ];

    await influx.write(formatted);
};
