const crypto = require("crypto");
const bcrypt = require("bcrypt");
const UserModel = require("../../models/User");

const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({
        message: "Token and password are required",
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    const user = await UserModel.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: {
        $gt: new Date(),
      },
    });

    if (!user) {
      return res.status(400).json({
        message: "Invalid or expired password reset token",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    user.password = hashedPassword;

    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    // Invalidate existing refresh token
    user.refreshToken = null;

    await user.save();

    return res.status(200).json({
      message: "Password reset successful",
    });
  } catch (error) {
    console.error("Reset password error:", error);

    return res.status(500).json({
      message: "Unable to reset password",
    });
  }
};

module.exports = {
  resetPassword,
};