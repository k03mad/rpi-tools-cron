'use strict';

const tasks = require('require-all')(`${__dirname}/app/tasks`);

const [section, name] = JSON.parse(process.env.npm_config_argv).remain;
const task = tasks[section][name];

task()
    .then(console.log)
    .catch(err => console.log(err));
