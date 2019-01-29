'use strict';

const {log} = require('utils-mad');
const {shell} = require('utils-mad');

module.exports = () => shell.run('sudo shutdown -r +1').catch(err => log.print(err));
