var express = require('express');
var router = express.Router();
var BitcoinController = require('../controllers/bitcoin');

const bitcoinController = new BitcoinController();

/* GET home page. */
router.get('/:destinationAddres/:amount', async (req, res, next) => {
  const { destinationAddres, amount } = req.params;

  const unspentTxs = await bitcoinController.getTxUnspent();

  if (!unspentTxs.txrefs || !unspentTxs.txrefs.length) {
    return res.status(500).send({
      msg: 'No available unspent txs'
    });
  };
  const txHash = await bitcoinController.generateTransaction(unspentTxs, destinationAddres, Number(amount * 10**8));
  res.send({ txHash });
});

module.exports = router;
