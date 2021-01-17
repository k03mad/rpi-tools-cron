'use strict';

const globby = require('globby');
const os = require('os');
const path = require('path');
const {influx} = require('utils-mad');
const {promises: fs} = require('fs');

/***/
module.exports = async () => {
    const requestFiles = await globby(path.join(os.tmpdir(), '_req_influx'));

    for (const file of requestFiles) {
        const content = await fs.readFile(file, {encoding: 'utf-8'});
        const {statusCode, method, domain, timing, date} = JSON.parse(content);

        await influx.write({
            meas: 'pi-node-request',
            values: {[`${statusCode} ${method} ${domain}`]: timing},
            timestamp: date,
        });

        await fs.unlink(file);
    }
};
