'use strict';

const {print} = require('utils-mad');

const [name] = JSON.parse(process.env.npm_config_argv).remain;

require(`./app/tasks/${name}`)()
    .then(msg => print.log(msg))
    .catch(err => print.ex(err));
