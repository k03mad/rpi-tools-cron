'use strict';

const asTable = require('as-table');
const env = require('../../env');
const {request, influx} = require('@k03mad/utils');

const tinkoffHandler = 'https://api-invest.tinkoff.ru/openapi/portfolio';
const tinkoffParams = {headers: {Authorization: `Bearer ${env.tinkoff.token}`}};

const telegramHandler = `https://api.telegram.org/bot${env.tinkoff.tg}/sendMessage`;
const telegramParams = text => ({
    method: 'POST',
    json: {
        chat_id: env.telegram.me,
        parse_mode: 'Markdown',
        disable_web_page_preview: true,
        text,
    },
});

const tgPreviousYield = {};

/***/
module.exports = async () => {
    const instruments = {
        etf: 'Etf',
        stock: 'Stock',
    };

    const tickerUsdToRub = 'USD000UTSTOM';

    const [
        {body: portfolio},
        {body: money},
    ] = await Promise.all([
        request.got(tinkoffHandler, tinkoffParams),
        request.got(`${tinkoffHandler}/currencies`, tinkoffParams),
    ]);

    let usdToRubPrice;

    const tickers = {};
    const balance = {};
    const yieldTotal = {};

    const tgMessage = [];

    portfolio.payload.positions.forEach(({
        instrumentType, ticker, lots,
        expectedYield, averagePositionPrice,
    }) => {
        if (Object.values(instruments).includes(instrumentType)) {
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

            if (instrumentType === instruments.stock) {
                const previousYield = tgPreviousYield[ticker];
                const currentYield = expectedYield.value;

                const isPriceChangedBy = num => Math.abs(previousYield - currentYield) >= num;

                if (isPriceChangedBy(1)) {
                    const arrow = previousYield > currentYield ? '↓' : '↑';
                    tgMessage.push([arrow, ticker, previousYield, '→', currentYield]);
                }

                tgPreviousYield[ticker] = currentYield;
            }
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

    if (tgMessage.length > 0) {
        const text = `\`\`\`\n${asTable(tgMessage.sort((a, b) => b[4] - a[4]))}\n\`\`\``;
        await request.got(telegramHandler, telegramParams(text));
    }

    await influx.write(formatted);
};
