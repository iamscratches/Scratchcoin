const Wallet = require('./index');
const TransactionPool = require('./transaction-pool');
const Blockchain = require('../blockchain');
const {INITIAL_BALANCE} = require('../config');

describe('Wallet', () => {
    let wallet, tp, bc;
    beforeEach(() =>{
        wallet = new Wallet();
        tp = new TransactionPool();
        bc = new Blockchain();
    });

    describe('creating a transaction', () =>{
        let transaction, sendAmount, recipient;

        beforeEach(() =>{
            sendAmount = 50;
            recipient = 'r4n0m-4ddr355';
            transaction = wallet.createTransaction(recipient, sendAmount, bc, tp);
        });

        describe('and doing the same transaction', () =>{
            beforeEach(() =>{
                wallet.createTransaction(recipient, sendAmount, bc, tp);
            });

            it('doubles the `sendAmount` substracted from the wallet balance', () =>{
                expect(transaction.outputs.find(output => output.address === wallet.publicKey).amount).toEqual(wallet.balance - sendAmount * 2);
            });

            it('clones the `sendAmount` output for the recipient', () =>{
                expect(transaction.outputs.filter(output => output.address === recipient).map(output => output.amount)).toEqual([sendAmount, sendAmount]);
            })
        });
    });

    describe('calculating the balance', () =>{
        let addBalance, repeatAdd, senderWallet;
        beforeEach(() =>{
            senderWallet = new Wallet();
            addBalance = 100;
            repeatAdd = 3;
            for(let i = 0; i <repeatAdd; i++){
                senderWallet.createTransaction(wallet.publicKey, addBalance, bc, tp);
            }
            bc.addBlock(tp.transactions);
        });

        it('Calculates the balance for blockchain transactions matching the recipient', () =>{
            expect(wallet.calculateBalance(bc)).toEqual(INITIAL_BALANCE + (addBalance * repeatAdd));
        });
        it('Calculates the balance for blockchain transactions matching the sender', () =>{
            expect(senderWallet.calculateBalance(bc)).toEqual(INITIAL_BALANCE - (addBalance * repeatAdd));
        });

        describe('and the recipient now conducts a transaction', () =>{
            let substractBalance, recipientBalance;
            beforeEach(() =>{
                tp.clear();
                substractBalance = 60;
                recipientBalance = wallet.calculateBalance(bc);
                wallet.createTransaction(senderWallet.publicKey, substractBalance, bc, tp);
                bc.addBlock(tp.transactions);
            });

            describe('and the sender sends another transaction to the recipient', () =>{
                beforeEach(() =>{
                    tp.clear();
                    senderWallet.createTransaction(wallet.publicKey, addBalance, bc, tp);
                    bc.addBlock(tp.transactions);
                })

                it('calculates the recipient balance but only using transactions since its recent most one', ()=> {
                    expect(wallet.calculateBalance(bc)).toEqual(recipientBalance - substractBalance + addBalance);
                })
            })
        })
    });
});