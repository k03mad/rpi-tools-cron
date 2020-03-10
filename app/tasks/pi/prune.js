'use strict';

const {shell} = require('utils-mad');

module.exports = () => shell.run('pnpm prune store');
