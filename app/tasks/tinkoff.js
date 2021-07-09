'use strict';

const {influx, tinkoff} = require('@k03mad/utils');

/***/
module.exports = async () => {
    const instrumentTypes = new Set(['Stock', 'Etf']);
    const tickerUsdToRub = 'USD000UTSTOM';

    let usdToRubPrice;

    const tickers = {};
    const balance = {};
    const yieldTotal = {};

    const {portfolio, currencies} = await tinkoff.portfolio();

    portfolio.forEach(({
        instrumentType, ticker, lots,
        expectedYield, averagePositionPrice,
    }) => {
        if (instrumentTypes.has(instrumentType)) {

            const currentYield = expectedYield.value;
            const currentYieldCur = expectedYield.currency;
            const currentValue = (lots * averagePositionPrice.value) + currentYield;
            const currentPrice = currentValue / lots;

            if (!tickers[`yield-${currentYieldCur}`]) {
                tickers[`yield-${currentYieldCur}`] = {[ticker]: {}};
            }

            if (!tickers[`price-${currentYieldCur}`]) {
                tickers[`price-${currentYieldCur}`] = {[ticker]: {}};
            }

            if (!tickers[`price-total-${currentYieldCur}`]) {
                tickers[`price-total-${currentYieldCur}`] = {[ticker]: {}};
            }

            if (!balance[averagePositionPrice.currency]) {
                balance[averagePositionPrice.currency] = 0;
            }

            if (!yieldTotal[averagePositionPrice.currency]) {
                yieldTotal[averagePositionPrice.currency] = 0;
            }

            tickers[`yield-${currentYieldCur}`][ticker] = currentYield;
            tickers[`price-${currentYieldCur}`][ticker] = currentPrice;
            tickers[`price-total-${currentYieldCur}`][ticker] = currentValue;
            yieldTotal[averagePositionPrice.currency] += currentYield;
            balance[averagePositionPrice.currency] += currentValue;

        } else if (ticker === tickerUsdToRub) {
            usdToRubPrice = averagePositionPrice.value;
        }
    });

    currencies.forEach(elem => {
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
