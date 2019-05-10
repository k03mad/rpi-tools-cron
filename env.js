'use strict';

// remove "Automatic enabling of cancellation of promises is deprecated"
process.env.NTBA_FIX_319 = true;

module.exports = {
    pihole: {
        url: process.env.PIHOLE_URL,
        auth: process.env.PIHOLE_AUTH,
    },
    lastfm: {
        key: process.env.LASTFM_KEY,
        users: process.env.LASTFM_USERS.split(','),
    },
    tmdb: {
        key: process.env.TMDB_KEY,
    },
    myshows: {
        client: process.env.MYSHOWS_CLIENT,
        secret: process.env.MYSHOWS_SECRET,
        login: process.env.MYSHOWS_LOGIN,
        password: process.env.MYSHOWS_PASSWORD,
    },
};
