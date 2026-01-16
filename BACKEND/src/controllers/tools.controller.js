const dns = require('dns');
const https = require('https');
const http = require('http');
const net = require('net');
const tls = require('tls');
const urlModule = require('url');

const scanTarget = async (req, res) => {
    try {
        const { target } = req.body;
        if (!target) return res.status(400).json({ error: "Target is required" });

        // Normalize Hostname
        let hostname = target.replace(/^https?:\/\//, '').split('/')[0];

        const results = {
            target: hostname,
            timestamp: new Date().toISOString(),
            dns: {},
            headers: {},
            ports: [],
            ssl: null,
            robots: null
        };

        const promises = [];

        // 1. DNS Lookup
        promises.push(new Promise((resolve) => {
            dns.lookup(hostname, (err, address, family) => {
                if (!err) results.dns = { address, family };
                else results.dns = { error: err.message };
                resolve();
            });
        }));

        // 2. HTTP Headers
        promises.push(new Promise((resolve) => {
            const reqUrl = `https://${hostname}`;
            const req = https.get(reqUrl, { timeout: 3000 }, (res) => {
                results.headers = {
                    server: res.headers['server'],
                    status: res.statusCode,
                    poweredBy: res.headers['x-powered-by'] || 'Unknown'
                };
                resolve();
            });
            req.on('error', () => resolve()); // Ignore error, maybe site is http only
        }));

        // 3. Port Scan (Common Ports)
        const commonPorts = [21, 22, 80, 443, 3306, 8080];
        const checkPort = (port) => new Promise((resolve) => {
            const socket = new net.Socket();
            socket.setTimeout(1500);
            socket.on('connect', () => {
                results.ports.push({ port, status: 'OPEN' });
                socket.destroy();
                resolve();
            });
            socket.on('timeout', () => {
                results.ports.push({ port, status: 'CLOSED' });
                socket.destroy();
                resolve();
            });
            socket.on('error', () => {
                results.ports.push({ port, status: 'CLOSED' });
                socket.destroy();
                resolve();
            });
            socket.connect(port, hostname);
        });

        commonPorts.forEach(port => promises.push(checkPort(port)));

        // 4. SSL Details
        promises.push(new Promise((resolve) => {
            const socket = tls.connect(443, hostname, { servername: hostname, timeout: 3000 }, () => {
                const cert = socket.getPeerCertificate();
                if (cert && !socket.authorized /* simply checking existence */) {
                    // socket.authorized depends on CA list, often false for self-signed or without root CAs loaded
                }
                if (cert && Object.keys(cert).length > 0) {
                    results.ssl = {
                        issuer: cert.issuer.O || cert.issuer.CN,
                        validFrom: cert.valid_from,
                        validTo: cert.valid_to,
                        daysRemaining: Math.floor((new Date(cert.valid_to) - new Date()) / (1000 * 60 * 60 * 24))
                    };
                }
                socket.end();
                resolve();
            });
            socket.on('error', () => resolve());
        }));

        // 5. Robots.txt
        promises.push(new Promise((resolve) => {
            const req = https.get(`https://${hostname}/robots.txt`, { timeout: 3000 }, (res) => {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => {
                    if (res.statusCode === 200) results.robots = data.slice(0, 500) + (data.length > 500 ? '...' : ''); // Limit size
                    else results.robots = "Not Found (404)";
                    resolve();
                });
            });
            req.on('error', () => { results.robots = "Unreachable"; resolve(); });
        }));

        await Promise.all(promises);
        res.status(200).json(results);

    } catch (error) {
        console.error("Advanced Scan Error:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

module.exports = { scanTarget };
