const express = require("express");
const { registerAdmin } = require("../../controllers/admin/auth/AdminRegisterController");
const { loginAdmin } = require("../../controllers/admin/auth/AdminLoginController");
const { getMe } = require("../../controllers/admin/auth/AdminMeController");
const { logoutAdmin } = require("../../controllers/admin/auth/AdminLogoutController");
const { adminAuthToken } = require("../../middleware/adminAuth");

const router = express.Router();

// TEMPORARY — remove this line once you've registered your admin account(s).
router.post("/register", registerAdmin);

router.post("/login", loginAdmin);
router.get("/me", adminAuthToken, getMe);
router.post("/logout", adminAuthToken, logoutAdmin);

module.exports = router;
