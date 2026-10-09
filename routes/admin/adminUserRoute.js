const express = require("express");
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  suspendUser,
  unsuspendUser,
} = require("../../controllers/admin/userController");
const { adminAuthToken, requireAdminRole } = require("../../middleware/adminAuth");

const router = express.Router();

router.use(adminAuthToken);

router.get("/", getUsers);
router.get("/:id", getUserById);
router.patch("/:id", updateUser);
router.delete("/:id", requireAdminRole("superadmin"), deleteUser);
router.post("/:id/suspend", suspendUser);
router.post("/:id/unsuspend", unsuspendUser);

module.exports = router;
