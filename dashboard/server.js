const express = require('express');
const axios = require('axios');
const { exec } = require('child_process');

const app = express();
const port = 3001;

app.use(express.json());
app.use(express.static(__dirname));

// Configuración RPC directa al nodo Bitcoin de Nigiri
const RPC_URL = 'http://localhost:18443';
const RPC_AUTH = { username: 'admin1', password: '123' };

// Helper RPC directo via HTTP (sin pasar por WSL)
const rpc = async (method, params = []) => {
    const res = await axios.post(RPC_URL, { jsonrpc: '1.0', method, params }, { auth: RPC_AUTH });
    return res.data.result;
};

// Helper para comandos Nigiri CLI que no son RPC puro (faucet, etc.)
const runNigiri = (cmd) => {
    const commandBody = cmd.startsWith('nigiri ') ? cmd.substring(7) : cmd;
    const wslCmd = `wsl -d Ubuntu /usr/local/bin/nigiri ${commandBody}`;
    return new Promise((resolve, reject) => {
        exec(wslCmd, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error ejecutando: ${wslCmd}`, stderr || error.message);
                reject(stderr || error.message);
            } else resolve(stdout.trim());
        });
    });
};

// 1. Info General (Mempool y Bloques)
app.get('/api/info', async (req, res) => {
    try {
        const [mempool, blockchain] = await Promise.all([
            rpc('getmempoolinfo'),
            rpc('getblockchaininfo'),
        ]);
        res.json({ mempool, blockchain });
    } catch (err) {
        console.error('/api/info error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 2. Faucet: Recibir BTC de prueba
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

// 3. Minar: Generar 1 bloque
app.post('/api/mine', async (req, res) => {
    try {
        const address = await rpc('getnewaddress', ['', 'bech32']);
        const hashes = await rpc('generatetoaddress', [1, address]);
        res.json({ message: 'Block mined', blockHash: hashes[0] });
    } catch (err) {
        console.error('/api/mine error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 4. Crear Dirección nueva
app.get('/api/new-address', async (req, res) => {
    try {
        const address = await rpc('getnewaddress', ['', 'bech32']);
        res.json({ address });
    } catch (err) {
        console.error('/api/new-address error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 5. Saldo del wallet activo
app.get('/api/balance', async (req, res) => {
    try {
        const balance = await rpc('getbalance');
        res.json({ balance });
    } catch (err) {
        console.error('/api/balance error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 6. Saldo de dirección específica (scantxoutset)
app.post('/api/scan-address', async (req, res) => {
    const { address } = req.body;
    if (!address) return res.status(400).json({ error: 'Address required' });
    try {
        const result = await rpc('scantxoutset', ['start', [`addr(${address})`]]);
        res.json(result);
    } catch (err) {
        console.error('/api/scan-address error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 7. Enviar BTC simple (sendtoaddress)
app.post('/api/send', async (req, res) => {
    const { address, amount } = req.body;
    if (!address || !amount) return res.status(400).json({ error: 'Address and amount required' });
    try {
        const txid = await rpc('sendtoaddress', [address, amount]);
        res.json({ txid });
    } catch (err) {
        console.error('/api/send error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 8. Transacción RAW completa (create → fund → sign → send)
app.post('/api/raw-tx', async (req, res) => {
    const { address, amount } = req.body;
    if (!address || !amount) return res.status(400).json({ error: 'Address and amount required' });
    try {
        const steps = {};
        const rawHex = await rpc('createrawtransaction', [[], { [address]: amount }]);
        steps.createraw = rawHex;
        const funded = await rpc('fundrawtransaction', [rawHex]);
        steps.funded = funded.hex;
        const signed = await rpc('signrawtransactionwithwallet', [funded.hex]);
        steps.signed = signed.hex;
        const txid = await rpc('sendrawtransaction', [signed.hex]);
        steps.txid = txid;
        res.json({ steps, txid });
    } catch (err) {
        console.error('/api/raw-tx error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 9. Mempool detallada
app.get('/api/mempool', async (req, res) => {
    try {
        const [info, txids] = await Promise.all([
            rpc('getmempoolinfo'),
            rpc('getrawmempool'),
        ]);
        res.json({ info, txids });
    } catch (err) {
        console.error('/api/mempool error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

// 10. Info de bloque por hash
app.post('/api/block-info', async (req, res) => {
    const { blockHash } = req.body;
    if (!blockHash) return res.status(400).json({ error: 'Block hash required' });
    try {
        const block = await rpc('getblock', [blockHash, 2]);
        res.json(block);
    } catch (err) {
        console.error('/api/block-info error:', err.message);
        res.status(500).json({ error: err.message });
    }
});

app.listen(port, () => {
    console.log(`Backend Dashboard en http://localhost:${port}`);
    console.log('Asegúrate de que Nigiri esté corriendo (nigiri start)');
});
