'use strict';

const {log} = require('utils-mad');
const {runRepoScript} = require('../../utils');
const {shell} = require('utils-mad');

module.exports = () => shell.run(runRepoScript(
    'adblock-hosts-list',
    'deploy && pihole -g'
)).catch(err => log.print(err));
