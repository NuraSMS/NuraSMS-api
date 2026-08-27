const express = require('express')
const { getTransactions } = require('../../controllers/wallet/transactionsController')
const authToken = require('../../middleware/auth')
const router = express.Router()


router.get('/get-transactions', authToken, getTransactions )   

module.exports = router 