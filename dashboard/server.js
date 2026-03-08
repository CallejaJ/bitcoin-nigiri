const express = require('express');
const axios = require('axios');
const cors = require('cors');
const { exec } = require('child_process');

const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());
// Servir archivos estáticos (como index.html) directamente en la raíz /
app.use(express.static(__dirname)); 

// Configuración de Nigiri (Regtest por defecto)
const NIGIRI_RPC_URL = 'http://localhost:18443';
const NIGIRI_AUTH = 'admin1:1234'; // Credenciales por defecto de Nigiri/Bitcoin regtest

// Helper para ejecutar comandos de sistema (Nigiri CLI vía WSL en Ubuntu)
const runNigiri = (cmd) => {
    // Forzamos la ejecución específicamente en la distro 'Ubuntu'
    const commandBody = cmd.startsWith('nigiri ') ? cmd.substring(7) : cmd;
    const wslCmd = `wsl -d Ubuntu /usr/local/bin/nigiri ${commandBody}`;

    return new Promise((resolve, reject) => {
        exec(wslCmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error ejecutando: ${wslCmd}`, stderr || error.message);
                reject(stderr || error.message);
            }
            else resolve(stdout.trim());
        });
    });
};

// 1. Obtener Info General (Mempool y Bloques)
app.get('/api/info', async (req, res) => {
    try {
        const mempool = await runNigiri('nigiri rpc getmempoolinfo');
        const blockchain = await runNigiri('nigiri rpc getblockchaininfo');
        res.json({ 
            mempool: JSON.parse(mempool), 
            blockchain: JSON.parse(blockchain) 
        });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// 2. Faucet: Recibir 1 BTC de prueba
app.post('/api/faucet', async (req, res) => {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address required' });
    try {
        const result = await runNigiri(`nigiri faucet ${address}`);
        res.json({ message: 'Faucet success', result });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// 3. Minar: Generar 1 bloque para confirmar transacciones
app.post('/api/mine', async (req, res) => {
    try {
        // Obtenemos una dirección propia para recibir la recompensa del minado
        const address = await runNigiri('nigiri rpc getnewaddress "" "bech32"');
        // Comando corregido: usamos 'rpc' directamente en lugar de 'bitcoin-cli'
        const result = await runNigiri(`nigiri rpc generatetoaddress 1 "${address}"`);
        res.json({ message: 'Block mined', blockHash: result });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// 4. Crear Dirección nueva
app.get('/api/new-address', async (req, res) => {
    try {
        const address = await runNigiri('nigiri rpc getnewaddress "" "bech32"');
        res.json({ address });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// 5. Consultar saldo del wallet activo
app.get('/api/balance', async (req, res) => {
    try {
        const balance = await runNigiri('nigiri rpc getbalance');
        res.json({ balance: parseFloat(balance) });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// 6. Consultar saldo de una dirección específica (scantxoutset)
app.post('/api/scan-address', async (req, res) => {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address required' });
    try {
        const result = await runNigiri(`nigiri rpc scantxoutset "start" '["addr(${address})"]'`);
        res.json(JSON.parse(result));
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// 7. Enviar BTC simple (sendtoaddress)
app.post('/api/send', async (req, res) => {
    const { address, amount } = req.body;
    if (!address || !amount) return res.status(400).json({ error: 'Address and amount required' });
    try {
        const txid = await runNigiri(`nigiri rpc sendtoaddress "${address}" ${amount}`);
        res.json({ txid });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// 8. Transacción RAW completa (create → fund → sign → send)
app.post('/api/raw-tx', async (req, res) => {
    const { address, amount } = req.body;
    if (!address || !amount) return res.status(400).json({ error: 'Address and amount required' });
    try {
        const steps = {};
        // Paso 1: Crear transacción RAW
        const rawHex = await runNigiri(`nigiri rpc createrawtransaction "[]" '{"${address}":${amount}}'`);
        steps.createraw = rawHex;
        // Paso 2: Fondear (seleccionar UTXOs)
        const fundedRaw = await runNigiri(`nigiri rpc fundrawtransaction "${rawHex}"`);
        const funded = JSON.parse(fundedRaw);
        steps.funded = funded.hex;
        // Paso 3: Firmar
        const signedRaw = await runNigiri(`nigiri rpc signrawtransactionwithwallet "${funded.hex}"`);
        const signed = JSON.parse(signedRaw);
        steps.signed = signed.hex;
        // Paso 4: Enviar
        const txid = await runNigiri(`nigiri rpc sendrawtransaction "${signed.hex}"`);
        steps.txid = txid;
        res.json({ steps, txid });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// 9. Inspeccionar mempool detallada
app.get('/api/mempool', async (req, res) => {
    try {
        const info = await runNigiri('nigiri rpc getmempoolinfo');
        const rawpool = await runNigiri('nigiri rpc getrawmempool');
        res.json({ info: JSON.parse(info), txids: JSON.parse(rawpool) });
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

// 10. Info de bloque por hash
app.post('/api/block-info', async (req, res) => {
    const { blockHash } = req.body;
    if (!blockHash) return res.status(400).json({ error: 'Block hash required' });
    try {
        const block = await runNigiri(`nigiri rpc getblock "${blockHash}" 2`);
        res.json(JSON.parse(block));
    } catch (err) {
        res.status(500).json({ error: err });
    }
});

app.listen(port, () => {
    console.log(`Backend Dashboard en http://localhost:${port}`);
    console.log('Asegúrate de que Nigiri esté corriendo (nigiri start)');
});
