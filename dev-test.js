// const Blockchain = require('./blockchain');
// const bc = new Blockchain();
// startTime = Date.now();
// for(let i = 0; i <10; i++){
//     console.log(bc.addBlock(`foo ${i}`).toString());
// }
// console.log((Date.now() - startTime)/(5));

const Wallet = require('./wallet');
const wallet = new Wallet();
console.log(wallet.toString());