'use strict';

const {shell} = require('utils-mad');

/** @returns {Promise} */
module.exports = () => shell.run('mad-pptp');
