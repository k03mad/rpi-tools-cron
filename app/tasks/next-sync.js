'use strict';

const {repo} = require('@k03mad/utils');

/** @returns {Promise<string>} */
module.exports = async () => {
    try {
        await repo.run('nextdns-lists-sync', 'upload');
    } catch (err) {
        if (!err.includes('nothing to commit')) {
            throw err;
        }
    }
};
