'use strict';

const {repo} = require('utils-mad');

/** @returns {Promise<string>} */
module.exports = () => repo.run('magnet-co-parser', 'start');
