'use strict';

const getMikrotik = require('../../lib/mikrotik');
const oui = require('oui');
const {log} = require('utils-mad');
const {sendToInflux} = require('../../lib/utils');

/**
 * Get mikrotik usage
 */
module.exports = async () => {
    try {
        const clientsSignal = {};
        const clientsTraffic = {};
        const interfaceTraffic = {};
        const interfaceSpeed = {};

        const [[usage], interfaces, wifiClients, ...monitorTraffic] = await getMikrotik([
            '/system/resource/print',
            '/interface/print',
            '/interface/wireless/registration-table/print',
            ...['ether1', 'ether2', 'ether3', 'ether4', 'ether5', 'wlan1', 'wlan2'].map(
                elem => ['/interface/monitor-traffic', `=interface=${elem}`, '=once']
            ),
        ]);

        const health = {
            mem: Number(usage['total-memory']) - Number(usage['free-memory']),
            cpu: Number(usage['cpu-load']),
            hdd: Number(usage['total-hdd-space']) - Number(usage['free-hdd-space']),
        };

        // signal-strength and data usage by wifi clients
        wifiClients.forEach(elem => {
            const dbm = elem['signal-strength'].replace(/@.+/, '');
            const trf = elem.bytes.replace(',', '.');
            const mac = elem['mac-address'];

            const [vendor] = (oui(mac) || '').split('\n')[0].split(' ');
            const key = `${vendor}_${mac}`;

            clientsSignal[key] = Number(dbm);
            clientsTraffic[key] = Number(trf);
        });

        interfaces.forEach(elem => {
            const {name} = elem;
            const rx = Number(elem['rx-byte']);
            const tx = Number(elem['tx-byte']);

            // data usage by ethernet clients, except WAN
            // to add to wifi clients data graph
            if (/ether[2-5]/.test(name)) {
                clientsTraffic[name] = rx + tx;
            }

            if (name !== 'bridge') {
                interfaceTraffic[`${name}_in`] = rx;
                interfaceTraffic[`${name}_out`] = tx;
            }
        });

        monitorTraffic.forEach(elem => {
            const [obj] = elem;
            const {name} = obj;
            interfaceSpeed[`${name}_in`] = Number(obj['rx-bits-per-second']);
            interfaceSpeed[`${name}_out`] = Number(obj['tx-bits-per-second']);
        });

        await Promise.all([
            sendToInflux({meas: 'router-usage', values: health}),
            sendToInflux({meas: 'router-clients-signal', values: clientsSignal}),
            sendToInflux({meas: 'router-clients-traffic', values: clientsTraffic}),
            sendToInflux({meas: 'router-interface-traffic', values: interfaceTraffic}),
            sendToInflux({meas: 'router-interface-speed', values: interfaceSpeed}),
        ]);
    } catch (err) {
        log.print(err);
    }
};
