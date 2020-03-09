'use strict';

const ms = require('ms');
const path = require('path');
const {adg, hosts} = require('utils-mad');
const {promises: fs} = require('fs');

module.exports = async () => {
    const start = new Date().getTime();

    const SAVE_TO_FILE = './domains.log';

    const excludedDomains = await fs.readFile(
        path.join(__dirname, './lib/excludeDomains.txt'),
        {encoding: 'utf-8'},
    );

    const buildRegex = `(${excludedDomains.split('\n')
        .filter(Boolean)
        .map(elem => `.${elem.trim().replace(/\./g, '\\.')}`)
        .join('|')})$`;

    const {data} = await adg.get('querylog');

    let log;

    try {
        log = await fs.readFile(SAVE_TO_FILE, {encoding: 'utf-8'});
    } catch (err) {
        if (err.code !== 'ENOENT') {
            throw err;
        }
    }

    const domains = new Set(
        log
            ? log.split('\n').slice(0, -1).filter(elem => elem.includes('.'))
            : '',
    );

    data.forEach(elem => {
        const host = elem.question.host.replace(/^www\./, '');

        if (
            elem.reason === 'NotFilteredNotFound'
            && host.includes('.')
        ) {
            domains.add(host);
        }
    });

    const sortedDomains = hosts.comment(
        hosts.sort(domains).filter(elem => !elem.match(buildRegex)),
        {comment: ''},
    );

    sortedDomains.push(`[ ${sortedDomains.length}d — ${ms(new Date().getTime() - start)} ]`);
    await fs.writeFile(SAVE_TO_FILE, sortedDomains.join('\n'));
};
