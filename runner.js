'use strict';

const tasks = require('require-all')(`${__dirname}/app/tasks`);
const {print} = require('utils-mad');

const [section, name] = JSON.parse(process.env.npm_config_argv).remain;
const task = tasks[section][name];

task()
    .then(msg => print.log(msg))
    .catch(err => print.ex(err));
