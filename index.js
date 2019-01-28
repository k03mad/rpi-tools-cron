'use strict';

const {printMsg} = require('./app/lib/utils');

require('./app/cron');

printMsg(`Started: ${__dirname}`);
