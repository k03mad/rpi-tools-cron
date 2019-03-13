'use strict';

const getMikrotik = require('../../lib/mikrotik');
const oui = require('oui');
const {appendToInflux, sendToInflux} = require('../../lib/utils');
const {log} = require('utils-mad');

/**
 * Get mikrotik usage
 */
const getData = async () => {
    try {
        const clientsSignal = {};
        const clientsTraffic = {};
        const interfaceTraffic = {};
        const interfaceSpeed = {};

        const [[usage], interfaces, wifiClients, ...monitorTraffic] = await getMikrotik([
            '/system/resource/print',
            '/interface/print',
            '/interface/wireless/registration-table/print',
            ...['wan1', 'ether1', 'ether2', 'ether3', 'ether4', 'wlan1', 'wlan2']
                .map(elem => ['/interface/monitor-traffic', `=interface=${elem}`, '=once']),
        ]);

        const health = {
            mem: Number(usage['total-memory']) - Number(usage['free-memory']),
            cpu: Number(usage['cpu-load']),
            hdd: Number(usage['total-hdd-space']) - Number(usage['free-hdd-space']),
            uptime: usage.uptime,
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
            if (name.includes('ether')) {
                clientsTraffic[name] = rx + tx;
            }

            if (name !== 'bridge') {
                interfaceTraffic[`${name}_rx`] = rx;
                interfaceTraffic[`${name}_tx`] = tx;
            }
        });

        monitorTraffic.forEach(elem => {
            const [obj] = elem;
            const {name} = obj;
            interfaceSpeed[`${name}_rx`] = Number(obj['rx-bits-per-second']);
            interfaceSpeed[`${name}_tx`] = Number(obj['tx-bits-per-second']);
        });

        await Promise.all([
            appendToInflux({meas: 'router-clients-traffic', values: clientsTraffic}),
            appendToInflux({meas: 'router-interface-traffic', values: interfaceTraffic}),
            sendToInflux({meas: 'router-clients-signal', values: clientsSignal}),
            sendToInflux({meas: 'router-interface-speed', values: interfaceSpeed}),
            sendToInflux({meas: 'router-usage', values: health}),
        ]);
    } catch (err) {
        log.print(err);
    }
};

module.exports = getData;
