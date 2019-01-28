'use strict';

const {date} = require('utils-mad');

/**
 * Print message with datestamp
 * @param {string} msg to add time
 * @returns {string}
 */
const printMsg = msg => {
    const dateMsg = `\n[${date.now()}]\n`;
    const prettyMsg = typeof msg === 'string' ? msg : msg.toString();

    console.log(dateMsg + prettyMsg);
    return prettyMsg;
};

/**
 * Open repo and run script
 * @param {string} repo to change dir
 * @param {string} script to run
 * @returns {string}
 */
const runRepoScript = (repo, script) => [
    `cd ~/git/${repo}`,
    'git reset --hard',
    'git pull',
    'npm run setup',
    `npm run ${script}`,
];

module.exports = {
    printMsg,
    runRepoScript,
};
