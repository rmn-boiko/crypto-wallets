require('dotenv').config();
const BlockIo = require('block_io');

const HttpsProxyAgent = require("https-proxy-agent"),
      axios = require("axios");

const httpsAgent = new HttpsProxyAgent({
  host: process.env.PROXY_HOST || "5.61.58.211",
  port: parseInt(process.env.PROXY_PORT) || 4010,
  auth: `${process.env.PROXY_USER}:${process.env.PROXY_PASSWORD}`
})

const axiosInstance = axios.create({httpsAgent});

class BitcoinBlockIoController {
  apiKey = process.env.BLOCK_IO_API_KEY;
  pin = process.env.BLOCK_IO_PIN;
  async generateTransaction (addressFrom, destinationAddress, amountToSend) {
    const config = {
      api_key: this.apiKey,
      version: 2
    }
    const block_io = new BlockIo(config);
    const { data: preparedTx } = await axiosInstance.get('https://block.io/api/v2/prepare_transaction/', {
      params: {
        api_key: this.apiKey,
        amounts: amountToSend,
        to_addresses: destinationAddress,
        from_addresses: addressFrom,
        priority: 'custom',
        custom_network_fee: 0.0002
      }
    });
    const signedTx = await block_io.create_and_sign_transaction({ data: preparedTx, pin: this.pin });
    const submitedTx = await axiosInstance.get(`https://block.io/api/v2/submit_transaction/`, {
      params: {
        api_key: this.apiKey
      },
      data: {
        transaction_data: signedTx
      }
    });

    return submitedTx.data;
  };
}

module.exports = BitcoinBlockIoController;