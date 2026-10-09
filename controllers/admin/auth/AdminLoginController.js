const AdminModel = require("../../../models/admin/Admin");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const admin = await AdminModel.findOne({ email: normalizedEmail });

    if (!admin) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        message: "This admin account has been deactivated",
      });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = jwt.sign(
      {
        id: admin._id,
        email: admin.email,
        role: admin.role,
        scope: "admin",
      },
      process.env.JWT_ADMIN_ACCESS_SECRET,
      { expiresIn: "45m" },
    );

    const refreshToken = jwt.sign(
      { id: admin._id, scope: "admin" },
      process.env.JWT_ADMIN_REFRESH_SECRET,
      { expiresIn: "7d" },
    );

    admin.refreshToken = refreshToken;
    admin.lastLoginAt = new Date();
    await admin.save();

    res.cookie("adminRefreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const { password: _, refreshToken: __, ...safeAdmin } = admin.toObject();

    return res.status(200).json({
      message: "Login successful",
      admin: safeAdmin,
      accessToken,
    });
  } catch (error) {
    console.error("Admin login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = { loginAdmin };
