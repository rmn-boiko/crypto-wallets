const bitcoin = require('bitcoinjs-lib');
const axios = require('axios');

class BitcoinController {
  privateKey = process.env.PRIVATE_KEY
  address = process.env.ADDRESS
  wif = process.env.WIF
  providerUrl = 'https://api.blockcypher.com/v1/btc/test3'
  defaultFee = 500000 // it will be 0.00005 BTC
  _calculateChange (balance) {
    return balance-this.defaultFee;
  }
  async _sendTransaction (txHex) {
    const result = await axios.post(`${this.providerUrl}/txs/push`, {
      tx: txHex
    });
    return result.data.tx;
  }
  async getTxUnspent () {
    const result = await axios.get(`${this.providerUrl}/addrs/${this.address}?unspentOnly=true`);
    return result.data;
  }
  async getTXHex (txId) {
    const result = await axios.get(`${this.providerUrl}/txs/${txId}?includeHex=true`);
    return result.data.hex;
  }
  async generateTransaction (unpentTxs, destinationAddress, amountToSend) {
    const change = this._calculateChange(unpentTxs.balance);
    const keypair = bitcoin.ECPair.fromWIF(this.wif, bitcoin.networks.testnet);
    const tx = new bitcoin.Psbt({ network: bitcoin.networks.testnet });
    tx.addOutput({
      address: destinationAddress,
      value: amountToSend
    });
    tx.addOutput({
      address: this.address,
      value: change
    });
    for (const unpentTx of unpentTxs.txrefs) {
      const txHex = await this.getTXHex(unpentTx.tx_hash);

      tx.addInput({
        hash: unpentTx.tx_hash,
        index: unpentTx.tx_output_n,
        nonWitnessUtxo: Buffer.from(txHex, 'hex')
      });
    }
    await tx.signAllInputsAsync(keypair);
    tx.finalizeAllInputs();
    const completedTx = tx.extractTransaction()

    const txHash = completedTx.toHex();
    console.log(txHash)
    const pushedTxInfo = await this._sendTransaction(txHash);
    return pushedTxInfo.hash;
  };
}

module.exports = BitcoinController;