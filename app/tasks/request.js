'use strict';

const globby = require('globby');
const os = require('os');
const path = require('path');
const {influx, print} = require('@k03mad/utils');
const {promises: fs} = require('fs');

/***/
module.exports = async () => {
    const requestFiles = await globby(path.join(os.tmpdir(), '_req_stats'));

    for (const file of requestFiles) {
        const content = await fs.readFile(file, {encoding: 'utf-8'});
        let parsed;

        try {
            parsed = JSON.parse(content);
        } catch (err) {
            print.ex(err, {before: `Cannot parse request data\n${file}`});
            continue;
        }

        const {statusCode, method, domain, timing, date} = parsed;
        await influx.write({
            meas: 'pi-node-request',
            values: {[`${statusCode} ${method} ${domain}`]: timing},
            timestamp: date,
        });

        await fs.unlink(file);
    }
};
