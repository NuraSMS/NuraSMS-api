const express = require('express')
const { authToken } = require('../../middleware/auth')
const { getTransactions } = require('../../controllers/wallet/transactionsController')
const router = express.Router()


router.get('/get-transactions', authToken, getTransactions )   

module.exports = router 