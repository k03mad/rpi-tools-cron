'use strict';

const {influx, mikrotik, request} = require('utils-mad');

module.exports = async () => {

    const minBytesFilter = 1024 * 1024;

    const [connections, dhcpLeases] = await mikrotik.write([
        ['/ip/firewall/connection/print'],
        ['/ip/dhcp-server/lease/print'],
    ]);

    dhcpLeases.push({
        address: '192.168.1.100',
        comment: 'Pi',
    }, {
        address: '192.168.1.133',
        comment: 'Mikrotik',
    });

    const filtered = connections
        .map(elem => ({
            src: elem['src-address'].replace(/:.+/, ''),
            dst: elem['dst-address'].replace(/:.+/, ''),
            bytes: Number(elem['orig-bytes']) + Number(elem['repl-bytes']),
        }))
        .filter(elem => elem.src.match(/^(192|10|172)\./)
            && elem.bytes >= minBytesFilter);

    if (filtered.length > 0) {
        for (const [i, elem] of filtered.entries()) {
            const [srcClient] = dhcpLeases.filter(lease => lease.address === elem.src);
            const [dstClient] = dhcpLeases.filter(lease => lease.address === elem.dst);

            if (srcClient) {
                elem.src = srcClient.comment;
            }

            if (dstClient) {
                elem.dst = dstClient.comment;
            } else {
                let body = {};

                try {
                    ({body} = await request.cache(`https://extreme-ip-lookup.com/json/${elem.dst}`));
                } catch {}

                elem.dst = body.ipName || body.org || elem.dst;
            }

            filtered[i] = elem;
        }

        const values = {};

        filtered.forEach(elem => {
            const name = `${elem.src} - ${elem.dst}`;

            if (values[name]) {
                values[name] += elem.bytes;
            } else {
                values[name] = elem.bytes;
            }
        });

        await influx.append({meas: 'router-connections', values});
    }
};
