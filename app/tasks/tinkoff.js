'use strict';

const asTable = require('as-table');
const {influx, tinkoff} = require('@k03mad/utils');

const tgPreviousYield = {};

/***/
module.exports = async () => {
    const alertChangeNum = 1;

    const instruments = {
        etf: 'Etf',
        stock: 'Stock',
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
        if (Object.values(instruments).includes(instrumentType)) {
            const currentYield = expectedYield.value;

            if (!tickers[`yield-${expectedYield.currency}`]) {
                tickers[`yield-${expectedYield.currency}`] = {[ticker]: {}};
            }

            if (!balance[averagePositionPrice.currency]) {
                balance[averagePositionPrice.currency] = 0;
            }

            if (!yieldTotal[averagePositionPrice.currency]) {
                yieldTotal[averagePositionPrice.currency] = 0;
            }

            tickers[`yield-${expectedYield.currency}`][ticker] = currentYield;
            yieldTotal[averagePositionPrice.currency] += currentYield;
            balance[averagePositionPrice.currency] += (lots * averagePositionPrice.value) + currentYield;

            if (instrumentType === instruments.stock) {
                const previousYield = tgPreviousYield[ticker];

                if (Math.abs(previousYield - currentYield) >= alertChangeNum) {
                    const arrow = previousYield > currentYield ? '▼' : '▲';
                    tgMessage.push([arrow, ticker, currentYield, '⟸', previousYield]);
                }

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
        const text = `\`\`\`\n${asTable(tgMessage.sort((a, b) => b[2] - a[2]))}\n\`\`\``;
        await tinkoff.notify({text});
    }

    await influx.write(formatted);
};
