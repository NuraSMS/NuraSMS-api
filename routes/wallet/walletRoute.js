const express = require('express')
const { authToken } = require('../../middleware/auth')
const { getWalletBalance } = require('../../controllers/wallet/walletController')
const router = express.Router()


router.get('/get-wallet-balance', authToken, getWalletBalance )   

module.exports = router 