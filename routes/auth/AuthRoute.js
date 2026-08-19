const express = require('express');
const { register } = require('../../controllers/auth/RegisterController');
const { login } = require('../../controllers/auth/LoginController');
const { forgotPassword } = require('../../controllers/auth/forgotPassword');
const { resetPassword } = require('../../controllers/auth/ResetPassword');
const router = express.Router()


router.post('/signup', register);
router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

module.exports = router
