var express = require('express');
var router = express.Router();
var BitcoinController = require('../controllers/bitcoin');
var BitcoinBlockIoController = require('../controllers/bitcoin-block-io');

const bitcoinController = new BitcoinController();
const bitcoinBlockIoController = new BitcoinBlockIoController();

/* GET home page. */
router.get('/:destinationAddres/:amount', async (req, res, next) => {
  const { destinationAddres, amount } = req.params;

  const unspentTxs = await bitcoinController.getTxUnspent();

  if (!unspentTxs.txrefs || !unspentTxs.txrefs.length) {
    return res.status(500).send({
      msg: 'No available unspent txs'
    });
  };
  try {
    const txHash = await bitcoinController.generateTransaction(unspentTxs, destinationAddres, Number(amount * 10**8));
    res.send({ txHash });
  } catch (err) {
    res.status(400).send({ msg: err });
  }
});

router.get('/block-io/:addressFrom/:destinationAddres/:amount', async (req, res, next) => {
  const { destinationAddres, addressFrom, amount } = req.params;

  try {
    const txInfo = await bitcoinBlockIoController.generateTransaction(addressFrom, destinationAddres, Number(amount));
    res.send(txInfo);
  } catch (err) {
    let errMessage = err.toJSON();
    if (err?.response?.data) {
      errMessage = err?.response?.data;
    }
    res.status(400).send(errMessage);
  }
});

router.post('/block-io/set-config', async (req, res, next) => {
  const { apiKey, pin } = req.body;
  bitcoinBlockIoController.apiKey = apiKey;
  bitcoinBlockIoController.pin = pin;
})

module.exports = router;
