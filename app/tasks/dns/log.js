'use strict';

const ms = require('ms');
const {adg} = require('utils-mad');
const {promises: fs} = require('fs');

module.exports = async () => {
    const start = new Date().getTime();

    const FILE = './domains.log';
    const excludeDomains = `(${[

        '.arpa',
        '.cdn.ampproject.org',
        '.cdn.yandex.net',
        '.cdninstagram.com',
        '.com.yandex.net',
        '.com.yandex.ru',
        '.datahound.com',
        '.disk.yandex.net',
        '.dl.dropboxusercontent.com',
        '.dlink',
        '.fbcdn.net',
        '.googleapis.com',
        '.googleusercontent.com',
        '.googlevideo.com',
        '.gvt1.com',
        '.ld.yandex.ru',
        '.market.mi-img.com',
        '.mycdn.me',
        '.net.yandex.net',
        '.net.yandex.ru',
        '.pearl-bdm.com',
        '.plex.direct',
        '.storage.yandex.net',
        '.stream.highwebmedia.com',
        '.strm.yandex.net',
        '.userapi.com',
        '.video.pscp.tv',
        '.vkuserlive.com',
        '.vkuservideo.net',
        '.yandex-team.ru',

    ].map(elem => elem.replace(/\./g, '\\.')).join('|')})$`;

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
