const AdminModel = require("../../../models/admin/Admin");

const logoutAdmin = async (req, res) => {
  try {
    await AdminModel.findByIdAndUpdate(req.admin.id, { refreshToken: null });

    res.clearCookie("adminRefreshToken", { path: "/" });

    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Admin logout error:", error);

    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { logoutAdmin };
