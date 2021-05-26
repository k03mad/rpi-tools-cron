'use strict';

const {request, influx} = require('@k03mad/utils');
const {tokens} = require('../../env');

const porfolioHandler = 'https://api-invest.tinkoff.ru/openapi/portfolio';
const requestParams = {headers: {Authorization: `Bearer ${tokens.tinkoff}`}};
// /openapi/portfolio/currencies

/***/
module.exports = async () => {
    const filterInstruments = '^(Etf|Stock)$';
    const tickerUsdToRub = 'USD000UTSTOM';

    const [
        {body: portfolio},
        {body: money},
    ] = await Promise.all([
        request.got(porfolioHandler, requestParams),
        request.got(`${porfolioHandler}/currencies`, requestParams),
    ]);

    let usdToRubPrice;

    const tickers = {};
    const balance = {};
    const yieldTotal = {};

    portfolio.payload.positions.forEach(({
        instrumentType, ticker, lots,
        expectedYield, averagePositionPrice,
    }) => {
        if (instrumentType.match(filterInstruments)) {
            if (!tickers[`yield-${expectedYield.currency}`]) {
                tickers[`yield-${expectedYield.currency}`] = {[ticker]: {}};
            }

            if (!balance[averagePositionPrice.currency]) {
                balance[averagePositionPrice.currency] = 0;
            }

            if (!yieldTotal[averagePositionPrice.currency]) {
                yieldTotal[averagePositionPrice.currency] = 0;
            }

            tickers[`yield-${expectedYield.currency}`][ticker] = expectedYield.value;
            yieldTotal[averagePositionPrice.currency] += expectedYield.value;
            balance[averagePositionPrice.currency] += (lots * averagePositionPrice.value) + expectedYield.value;
        } else if (ticker === tickerUsdToRub) {
            usdToRubPrice = averagePositionPrice.value;
        }
    });

    money.payload.currencies.forEach(elem => {
        if (balance[elem.currency]) {
            balance[elem.currency] += elem.balance;
        }
    });

    yieldTotal.total = yieldTotal.RUB + (yieldTotal.USD * usdToRubPrice);
    balance.total = balance.RUB + (balance.USD * usdToRubPrice);

    const formatted = [
        ...Object
            .entries(tickers)
            .map(([meas, values]) => ({meas: `tinkoff-${meas}`, values})),

        {meas: 'tinkoff-yield-total', values: yieldTotal},
        {meas: 'tinkoff-balance', values: balance},
    ];

    await influx.write(formatted);
};
