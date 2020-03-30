'use strict';

module.exports = {
    lastfm: {
        key: process.env.LASTFM_KEY,
        users: process.env.LASTFM_USERS.split(','),
    },
    airvisual: {
        key: process.env.AIRVISUAL_KEY,
    },
};
