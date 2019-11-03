'use strict';

module.exports = {
    adg: {
        auth: process.env.ADG_AUTH,
        url: process.env.ADG_URL,
    },
    lastfm: {
        key: process.env.LASTFM_KEY,
        users: process.env.LASTFM_USERS.split(','),
    },
};
