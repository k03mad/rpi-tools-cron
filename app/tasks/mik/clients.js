'use strict';

const oui = require('oui');
const {influx, mikrotik} = require('utils-mad');

module.exports = async () => {
    const SEPARATOR = ' :: ';

    const clientsSignal = {};
    const clientsTraffic = {};

    const [
        interfaces,
        wifiClients,
        dhcpLeases,
    ] = await mikrotik.write([
        ['/interface/print'],
        ['/interface/wireless/registration-table/print'],
        ['/ip/dhcp-server/lease/print'],
    ]);

    wifiClients.forEach(elem => {
        const dbm = elem['signal-strength'].replace(/@.+/, '');
        const trf = elem.bytes.replace(',', '.');
        const mac = elem['mac-address'];

        const [client] = dhcpLeases.filter(lease => lease['mac-address'] === mac);

        let key;

        if (client && client.comment) {
            key = client.comment;
        } else {
            const [vendor] = oui(mac).split('\n')[0].match(/^(\w+( \w+)?)/);
            key = vendor + SEPARATOR + mac;
        }

        clientsTraffic[key] = Number(trf);
        clientsSignal[key] = Number(dbm);
    });

    interfaces.forEach(elem => {
        const sum = Number(elem['rx-byte']) + Number(elem['tx-byte']);

        if (elem.name.includes('ether') && sum > 0) {
            clientsTraffic[elem.name] = sum;
        }
    });

    await influx.append({meas: 'router-clients-traffic', values: clientsTraffic});
    await influx.diffBelow(5, {meas: 'router-clients-signal', values: clientsSignal});
};
