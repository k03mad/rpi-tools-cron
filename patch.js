'use strict';

const path = require('path');
const {array, print} = require('utils-mad');
const {dim, blue} = require('colorette');
const {promises: fs} = require('fs');

const patches = {
    '/node_modules/.pnpm/node-routeros@1.6.8/node_modules/node-routeros/dist/connector/Receiver.js': {
        original: "throw new RosException_1.RosException('UNREGISTEREDTAG');",
        patch: "// throw new RosException_1.RosException('UNREGISTEREDTAG');",
    },
};

(async () => {
    try {
        await Promise.all(Object.entries(patches).map(async ([file, strings]) => {
            console.log(dim(`patch\n${blue(file)}`));

            const filePath = path.join(__dirname, file);
            let fileContent = await fs.readFile(filePath, {encoding: 'utf-8'});
            const errors = [];

            array.convert(strings).forEach(({original, patch}) => {
                fileContent = fileContent.replace(original, patch);

                if (!fileContent.includes(patch)) {
                    errors.push(`\nsomething goes wrong while patch ${file}:\nfrom: ${original}\nto: ${patch}`);
                }
            });

            if (errors.length > 0) {
                throw new Error(errors.join('\n'));
            }

            await fs.writeFile(filePath, fileContent);
        }));
    } catch (err) {
        print.ex(err, {before: 'node_modules patch', exit: true});
    }
})();
