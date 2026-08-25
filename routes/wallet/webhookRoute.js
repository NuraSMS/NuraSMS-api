const express = require('express');
const { handlePaystackWebhook } = require('../../controllers/wallet/webhookController');
const router = express.Router();

router.post('/webhook/paystack', express.json(), handlePaystackWebhook); 

module.exports = router;