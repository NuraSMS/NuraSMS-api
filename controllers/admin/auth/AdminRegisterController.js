const bcrypt = require("bcrypt");
const AdminModel = require("../../../models/admin/Admin");

// TEMPORARY ENDPOINT — use it once to create your admin account(s), then
// remove the route from routes/admin/adminAuthRoute.js.
// Guarded by ADMIN_SETUP_KEY so it isn't a wide-open signup route in the meantime.
const registerAdmin = async (req, res) => {
  try {
    const setupKey = req.headers["x-admin-setup-key"];

    if (!setupKey || setupKey !== process.env.ADMIN_SETUP_KEY) {
      return res.status(403).json({
        message: "Invalid or missing setup key",
      });
    }

    let { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        message: "Name, email, and password are required",
      });
    }

    email = email.trim().toLowerCase();
    name = name.trim();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    if (role && !["superadmin", "admin"].includes(role)) {
      return res.status(400).json({
        message: "Role must be 'superadmin' or 'admin'",
      });
    }

    const existingAdmin = await AdminModel.findOne({ email }).lean();

    if (existingAdmin) {
      return res.status(409).json({
        message: "An admin with this email already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const admin = await AdminModel.create({
      name,
      email,
      password: hashedPassword,
      role: role || "admin",
    });

    return res.status(201).json({
      message: "Admin registered successfully",
      adminId: admin._id,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "An admin with this email already exists",
      });
    }

    console.error("Admin registration error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = { registerAdmin };
