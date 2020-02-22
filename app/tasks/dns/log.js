'use strict';

const ms = require('ms');
const {adg} = require('utils-mad');
const {promises: fs} = require('fs');

module.exports = async () => {
    const start = new Date().getTime();

    const FILE = './domains.log';
    const excludeDomains = `(${[

        'akadns.net',
        'akamaiedge.net',
        'ampproject.net',
        'apple.com',
        'arpa',
        'cdn.ampproject.org',
        'cdninstagram.com',
        'datahound.com',
        'dl.dropboxusercontent.com',
        'dlink',
        'fbcdn.net',
        'google.com',
        'googleapis.com',
        'googleusercontent.com',
        'googlevideo.com',
        'gvt1.com',
        'market.mi-img.com',
        'microsoft.com',
        'mycdn.me',
        'pearl-bdm.com',
        'plex.direct',
        'storage.yandex.net',
        'stream.highwebmedia.com',
        'userapi.com',
        'video.pscp.tv',
        'vkuserlive.com',
        'vkuservideo.net',
        'xboxlive.com',
        'xiaomi.com',
        'yandex-team.ru',
        'yandex.net',
        'yandex.ru',

    ]
        .map(elem => `.${elem}`)
        .map(elem => elem.replace(/\./g, '\\.'))
        .join('|')})$`;

    const {data} = await adg.get('querylog');

    let log;

    try {
        log = await fs.readFile(FILE, {encoding: 'utf-8'});
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }

    const domains = new Set(log ? log.split('\n').slice(0, -1) : '');

    data.forEach(elem => {
        const host = elem.question.host.replace(/^www\./, '');

        if (
            elem.reason === 'NotFilteredNotFound'
            && host.includes('.')
        ) {
            domains.add(host);
        }
    });

    const sortedDomains = [...domains]
        .map(elem => elem.split('.').reverse())
        .sort()
        .map(elem => elem.reverse().join('.'))
        .filter(elem => !elem.match(excludeDomains));

    sortedDomains.push(`[ ${sortedDomains.length}d — ${ms(new Date().getTime() - start)} ]`);
    await fs.writeFile(FILE, sortedDomains.join('\n'));
};
