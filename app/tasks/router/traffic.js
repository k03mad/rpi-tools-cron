'use strict';

const {influx, mikrotik} = require('utils-mad');

module.exports = async () => {
    const SEPARATOR = ' :: ';

    const interfaceTraffic = {};
    const natTraffic = {};

    const [
        interfaces,
        firewallNat,
        dhcpLeases,
    ] = await mikrotik.get([
        '/interface/print',
        '/ip/firewall/nat/print',
        '/ip/dhcp-server/lease/print',
    ]);

    interfaces.forEach(elem => {
        if (elem.name !== 'bridge') {
            interfaceTraffic[`${elem.name}_rx`] = Number(elem['rx-byte']);
            interfaceTraffic[`${elem.name}_tx`] = Number(elem['tx-byte']);
        }
    });

    firewallNat.forEach((elem, i) => {
        let name;

        for (let j = i; j <= i; i--) {
            const {comment, 'dst-port': port} = firewallNat[i];

            if (comment) {
                name = port
                    ? port + SEPARATOR + comment
                    : `noport${SEPARATOR + comment}`;

                break;
            }
        }

        if (name && !name.includes('defconf')) {
            const REGEXP_IP = /((?:\d{1,3}\.){3}\d{1,3})/;
            const matchedIp = name.match(REGEXP_IP);

            if (matchedIp) {
                const [client] = dhcpLeases.filter(lease => lease.address === matchedIp[0]);

                if (client && client.comment) {
                    name = name.replace(REGEXP_IP, `${client.comment + SEPARATOR}$1`);
                }
            }

            name = name.replace(/(\d): /g, `$1${SEPARATOR}`);

            if (natTraffic[name]) {
                natTraffic[name] += Number(elem.bytes);
            } else {
                natTraffic[name] = Number(elem.bytes);
            }
        }
    });

    await influx.append([
        {meas: 'router-interface-traffic', values: interfaceTraffic},
        {meas: 'router-nat-traffic', values: natTraffic},
    ]);
};
