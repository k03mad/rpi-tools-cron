'use strict';

const {shell} = require('utils-mad');

module.exports = async () => {
    const log = await shell.run('pnpm prune store');
    return `${log}\n\nStore Pruned`.trim();
};
