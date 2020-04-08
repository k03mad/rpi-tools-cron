'use strict';

const {influx, mikrotik, request} = require('utils-mad');

module.exports = async () => {

    const minBytesFilter = 512 * 1024;

    const connections = await mikrotik.write('/ip/firewall/connection/print');

    const filtered = connections
        .map(elem => ({
            src: elem['src-address'].replace(/:.+/, ''),
            dst: elem['dst-address'].replace(/:.+/, ''),
            bytes: Number(elem['orig-bytes']) + Number(elem['repl-bytes']),
        }))
        .filter(elem => elem.src.match(/^(192|10|172)\./)
            && elem.bytes >= minBytesFilter);

    if (filtered.length > 0) {
        const data = ['country', 'ipName', 'org'];

        const send = {};

        for (const elem of filtered) {
            let body = {};

            try {
                ({body} = await request.cache(`https://extreme-ip-lookup.com/json/${elem.dst}`));
            } catch {}

            data.forEach(counter => {
                const name = body[counter];

                if (name) {
                    if (send[counter]) {
                        if (send[counter][name]) {
                            send[counter][name] += elem.bytes;
                        } else {
                            send[counter][name] = elem.bytes;
                        }
                    } else {
                        send[counter] = {[name]: elem.bytes};
                    }
                }
            });
        }

        for (const elem of data) {
            send[elem] && await influx.append({meas: `router-connections-${elem}`, values: send[elem]});
        }
    }
};
