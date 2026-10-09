const AdminModel = require("../../../models/admin/Admin");

const getMe = async (req, res) => {
  try {
    const admin = await AdminModel.findById(req.admin.id).select(
      "-password -refreshToken",
    );

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    return res.status(200).json({ admin });
  } catch (error) {
    console.error("Get admin profile error:", error);

    return res.status(500).json({ message: "Internal server error" });
  }
};

module.exports = { getMe };
