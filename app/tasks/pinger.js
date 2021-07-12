'use strict';

const {cloud} = require('../../env');
const {pinger} = require('@k03mad/utils');

/***/
module.exports = async () => {
    const cloudPorts = [cloud.port, 80, 443];

    await pinger.check([
        ...cloudPorts.map(port => ({domain: cloud.domain, port})),
        {domain: 'rutor.info'},
    ]);
};
