'use strict';

const ms = require('ms');
const {adg} = require('utils-mad');
const {promises: fs} = require('fs');

module.exports = async () => {
    const start = new Date().getTime();
    const FILE = './domains.log';

    const {data} = await adg.get('querylog');

    let log;

    try {
        log = await fs.readFile(FILE, {encoding: 'utf-8'});
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }

    const domains = new Set(log ? log.split('\n').slice(1) : '');

    data.forEach(elem => {
        const host = elem.question.host.replace(/^www\./, '');

        if (
            elem.reason === 'NotFilteredNotFound'
            && host.includes('.')
            && !host.endsWith('.dlink')
            && !host.endsWith('.arpa')
        ) {
            domains.add(host);
        }
    });

    const sortedDomains = [...domains]
        .map(elem => elem.split('.').reverse())
        .sort()
        .map(elem => elem.reverse().join('.'));

    sortedDomains.unshift(`[ ${sortedDomains.length}d — ${ms(new Date().getTime() - start)} ]`);
    await fs.writeFile(FILE, sortedDomains.join('\n'));
};
