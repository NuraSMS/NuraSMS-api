const UserModel = require("../../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const login = async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({
        message: "Identifier and password are required",
      });
    }

    const normalizedIdentifier = identifier.trim().toLowerCase();

    const user = await UserModel.findOne({
      $or: [
        { email: normalizedIdentifier },
        { username: normalizedIdentifier },
      ],
    });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    const accessToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
      },
      process.env.JWT_ACCESS_SECRET,
      {
        expiresIn: "15m",
      }
    );

    const refreshToken = jwt.sign(
      {
        id: user._id,
      },
      process.env.JWT_REFRESH_SECRET, 
      {
        expiresIn: "7d",
      }
    );

    user.refreshToken = refreshToken;
    await user.save();

    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite:
        process.env.NODE_ENV === "production" ? "None" : "Lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    const {
      password: _,
      refreshToken: __,
      ...safeUser
    } = user.toObject();

    return res.status(200).json({
      message: "Login successful",
      user: safeUser,
      accessToken,
    });
  } catch (error) {
    console.error("Login error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = { login };