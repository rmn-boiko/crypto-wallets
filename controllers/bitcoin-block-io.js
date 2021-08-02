require('dotenv').config();
const BlockIo = require('block_io');
const config = {
  api_key: process.env.BLOCK_IO_API_KEY,
  version: 2
}
const block_io = new BlockIo(config);
const HttpsProxyAgent = require("https-proxy-agent"),
      axios = require("axios");

const httpsAgent = new HttpsProxyAgent({ host: process.env.PROXY_HOST || "5.61.58.211", port: parseInt(process.env.PROXY_PORT) || 4010 })

const axiosInstance = axios.create({httpsAgent});

class BitcoinBlockIoController {
  async generateTransaction (destinationAddress, amountToSend) {
    const { data: preparedTx } = await axiosInstance.get(`https://block.io/api/v2/prepare_transaction/`, {
      params: {
        api_key: process.env.BLOCK_IO_API_KEY,
        amounts: amountToSend,
        to_addresses: destinationAddress,
        priority: 'custom',
        custom_network_fee: 0.0002
      }
    });

    const signedTx = await block_io.create_and_sign_transaction({ data: preparedTx, pin: process.env.BLOCK_IO_PIN });
    const submitedTx = await axiosInstance.get(`https://block.io/api/v2/submit_transaction/`, {
      params: {
        api_key: process.env.BLOCK_IO_API_KEY
      },
      data: {
        transaction_data: signedTx
      }
    });

    return submitedTx.data;
  };
}

module.exports = BitcoinBlockIoController;