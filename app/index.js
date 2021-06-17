const express = require('express');
const bodyParser = require('body-parser');
const Blockchain = require('../blockchain');
const P2pServer = require('./p2p-server');
const Wallet = require('../wallet');
const TransactionPool = require('../wallet/transaction-pool');
const Miner = require('./miner');

const HTTP_PORT = process.env.HTTP_PORT || 3001;

const app = express();
const bc = new Blockchain();
const wallet = new Wallet();
const tp = new TransactionPool();
const p2pServer = new P2pServer(bc, tp);
const miner = new Miner(bc, tp, wallet, p2pServer);

app.use(bodyParser.json());

app.get('/blocks', (req, res) => {
    blocks = bc.chain;
    blockSize = blocks.length;
    res.json({blockSize, blocks});
});

app.post('/mine', (req, res) => {
    const block = bc.addBlock(req.body.data);
    console.log(`New Block added: ${block.toString()}`);
    p2pServer.syncChains();
    res.redirect('/blocks');
});

app.get('/transaction', (req, res) => {
    memPool = tp.transactions;
    memPoolSize = memPool.length;
    res.json({memPoolSize, memPool});
});

app.post('/transact', (req, res) => {
    let {recipient, amount} = req.body;
    if(wallet.users[recipient])
        recipient = wallet.users[recipient];
    const transaction = wallet.createTransaction(recipient, amount, bc, tp);
    p2pServer.broadcastTransaction(transaction);
    res.redirect('/transaction');
});

app.get('/public-key', (req, res) => {
    res.json({ publicKey: wallet.publicKey });
});

app.get('/mine-transaction', (req, res) => {
    const block = miner.mine();
    console.log(`New Block has been added : ${block.toString()}`);
    res.redirect('/blocks');
})

app.get('/wallet', (req, res) => {
    let savedUsers = wallet.user;
    res.json({
        balance: wallet.calculateBalance(bc), 
        Privatekey: wallet.keyPair.getPrivate(),
        PublicKey: wallet.keyPair.getPublic().encode('hex'),
        savedUsers
    })
})

app.post('/save-users', (req, res) => {
    const {username, publicKey} = req.body;
    const usersList = wallet.addUser(username, publicKey);
    res.json({
        message: 'user added successfully',
        users: usersList
    });
})

app.listen(HTTP_PORT, () => console.log(`Listening on port ${HTTP_PORT}`));
p2pServer.listen();
