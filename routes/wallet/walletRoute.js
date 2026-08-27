const express = require('express')
const { getWalletBalance } = require('../../controllers/wallet/walletController')
const authToken = require('../../middleware/auth')
const router = express.Router()


router.get('/get-wallet-balance', authToken, getWalletBalance )   

module.exports = router 