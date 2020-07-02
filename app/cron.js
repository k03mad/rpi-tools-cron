'use strict';

const {Cron} = require('recron');
const {print, repo, shell, influx} = require('utils-mad');

const tasks = {
    '* * * * *': {
        adg: require('./tasks/adguard'),
        mik: require('./tasks/mikrotik'),
        pi: require('./tasks/pi'),
    },

    '* */6 * * *': {
        apt: async () => {
            const apt = await shell.run([
                'sudo apt-get update',
                'sudo apt-get upgrade -u -s',
            ]);

            const updates = apt.split('\n').filter(el => el.includes('Inst')).length;
            await influx.write({meas: 'pi-updates', values: {count: `Updates: ${updates}`}});
        },
    },

    '0 5 * * *': {
        parse: () => repo.run('magnet-co-parser', 'start'),
    },
};

const cron = new Cron();
cron.start();

for (const [key, value] of Object.entries(tasks)) {
    for (const [name, func] of Object.entries(value)) {
        cron.schedule(key, async () => {
            try {
                await func();
            } catch (err) {
                print.ex(err, {
                    before: `${key} :: ${name}`,
                    afterline: false,
                    exit: true,
                });
            }
        }, {timezone: 'Europe/Moscow'});
    }
}
