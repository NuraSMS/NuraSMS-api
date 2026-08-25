const { processPaystackEvent } = require("../../services/wallet/paystackEvents");

const handlePaystackWebhook = async (req, res) => {
  try {
    await processPaystackEvent(req, res);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  }
};

module.exports = { handlePaystackWebhook };