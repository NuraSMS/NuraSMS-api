const express = require('express')
const { createVirtualAccount, getVirtualAccount } = require('../../controllers/wallet/virtualAccountsController')
const { authToken } = require('../../middleware/auth')
const router = express.Router()

router.post('/create-virtual-account', authToken, createVirtualAccount )   
router.get('/get-virtual-account', authToken, getVirtualAccount )   

module.exports = router  