'use strict';

const {array, print, repo, shell, influx} = require('utils-mad');
const {Cron} = require('recron');

const tasks = {
    '* * * * *': [
        require('./tasks/adguard'),
        require('./tasks/mikrotik'),
        require('./tasks/pi'),
    ],

    '* */6 * * *': async () => {
        const apt = await shell.run([
            'sudo apt-get update',
            'sudo apt-get upgrade -u -s',
        ]);

        const updates = apt.split('\n').filter(el => el.includes('Inst')).length;
        await influx.write({meas: 'pi-updates', values: {count: `Updates: ${updates}`}});
    },

    '0 4,5 * * *': () => shell.run('mad-pptp'),
    '30 4,5 * * *': () => repo.run('magnet-co-parser', 'start'),
};

const cron = new Cron();
cron.start();

for (const [key, value] of Object.entries(tasks)) {
    for (const func of array.convert(value)) {
        cron.schedule(key, async () => {
            try {
                await func();
            } catch (err) {
                print.ex(err, {before: key, afterline: false, exit: true});
            }
        }, {timezone: 'Europe/Moscow'});
    }
}
