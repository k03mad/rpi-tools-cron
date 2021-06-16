'use strict';

const asTable = require('as-table');
const {influx, tinkoff} = require('@k03mad/utils');

const tgPreviousYield = {};

/***/
module.exports = async () => {
    const alertChangeYield = {
        Stock: {
            USD: 2,
            RUB: 50,
        },
        Etf: {
            USD: 5,
            RUB: 50,
        },
    };

    const tickerUsdToRub = 'USD000UTSTOM';

    let usdToRubPrice;

    const tickers = {};
    const balance = {};
    const yieldTotal = {};
    const tgMessage = [];

    const {portfolio, currencies} = await tinkoff.portfolio();

    portfolio.forEach(({
        instrumentType, ticker, lots,
        expectedYield, averagePositionPrice,
    }) => {
        if (Object.keys(alertChangeYield).includes(instrumentType)) {
            const currentYield = expectedYield.value;
            const currentYieldCur = expectedYield.currency;

            if (!tickers[`yield-${currentYieldCur}`]) {
                tickers[`yield-${currentYieldCur}`] = {[ticker]: {}};
            }

            if (!balance[averagePositionPrice.currency]) {
                balance[averagePositionPrice.currency] = 0;
            }

            if (!yieldTotal[averagePositionPrice.currency]) {
                yieldTotal[averagePositionPrice.currency] = 0;
            }

            tickers[`yield-${currentYieldCur}`][ticker] = currentYield;
            yieldTotal[averagePositionPrice.currency] += currentYield;
            balance[averagePositionPrice.currency] += (lots * averagePositionPrice.value) + currentYield;

            if (!tgPreviousYield[ticker]) {
                tgPreviousYield[ticker] = currentYield;
            }

            const previousYield = tgPreviousYield[ticker];

            if (Math.abs(previousYield - currentYield) >= alertChangeYield[instrumentType][currentYieldCur]) {
                const arrow = previousYield > currentYield ? '▼' : '▲';
                tgMessage.push([arrow, ticker, currentYield, currentYieldCur]);
                tgPreviousYield[ticker] = currentYield;
            }
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

    if (tgMessage.length > 0) {
        const table = asTable(tgMessage.sort((a, b) => b[2] - a[2]));
        const text = `\`\`\`\n${table}\n\`\`\``;

        await tinkoff.notify({text});
    }

    await influx.write(formatted);
};
