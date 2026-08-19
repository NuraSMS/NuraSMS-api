const crypto = require("crypto");
const UserModel = require("../../models/User");
const { Resend } = require("resend");
const sendForgotPasswordMail = require("../../utils/emails/forgotPasswordMail");

const resend = new Resend(process.env.RESEND_API_KEY);

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        message: "Email is required",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await UserModel.findOne({
      email: normalizedEmail,
    });

    // Don't reveal whether an account exists
    if (!user) {
      return res.status(200).json({
        message:
          "If an account exists with this email, a password reset link has been sent.",
      });
    }

    // Generate secure random token
    const resetToken = crypto.randomBytes(32).toString("hex");

    // Hash token before storing it in database
    const hashedToken = crypto
      .createHash("sha256")
      .update(resetToken)
      .digest("hex");

    // Token expires in 1 hour
    user.resetPasswordToken = hashedToken;
    user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000);

    await user.save();

    await sendForgotPasswordMail({
      email: user.email,
      firstName: user.firstName,
      token: resetToken,
    });

    return res.status(200).json({
      message:
        "If an account exists with this email, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);

    return res.status(500).json({
      message: "Unable to process password reset request",
    });
  }
};

module.exports = {
  forgotPassword,
};
