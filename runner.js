'use strict';

const {print} = require('utils-mad');

require(`./app/tasks/${process.env.npm_config_name}`)()
    .then(msg => print.log(msg))
    .catch(err => print.ex(err, {full: true}));
