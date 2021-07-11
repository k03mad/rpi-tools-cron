'use strict';

const {cloud} = require('../../env');
const {pinger} = require('@k03mad/utils');

/** @returns {Promise} */
module.exports = () => pinger.check([
    {domain: cloud.domain, port: 22},
    {domain: cloud.ip, port: 22},
]);
