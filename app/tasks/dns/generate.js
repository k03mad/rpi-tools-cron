'use strict';

const {repo, promise, adg} = require('utils-mad');

module.exports = async () => {
    await repo.run('adguard-home-lists-my', 'update');
    await repo.run('adguard-home-lists-converted', 'update');

    await promise.delay(5000);
    await adg.post('filtering/refresh', {json: {whitelist: true}});
};
