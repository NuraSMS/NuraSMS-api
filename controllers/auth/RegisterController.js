const bcrypt = require("bcrypt");
const UserModel = require("../../models/User");

const register = async (req, res) => {
  try {
    let {
      username,
      email,
      password,
      firstName,
      phoneNumber,
      lastName,
    } = req.body;

    // Validate required fields

    if (!username || !email || !password || !firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        message: "All fields are required",
      });
    }

    // Normalize input

    username = username.trim().toLowerCase();
    email = email.trim().toLowerCase();
    firstName = firstName.trim();
    lastName = lastName.trim();
    phoneNumber = phoneNumber.trim();

    // Validate username

    if (username.length < 3) {
      return res.status(400).json({
        message: "Username must be at least 3 characters",
      });
    }

    if (!/^[a-z0-9_]+$/.test(username)) {
      return res.status(400).json({
        message:
          "Username can only contain letters, numbers, and underscores",
      });
    }

    // Validate email

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        message: "Invalid email format",
      });
    }

    // Validate password

    if (password.length < 8) {
      return res.status(400).json({
        message: "Password must be at least 8 characters",
      });
    }

    // Check existing user

    const existingUser = await UserModel.findOne({
      $or: [
        { username },
        { email },
        { phoneNumber }
      ],
    }).lean();

    if (existingUser) {
      if (existingUser.username === username) {
        return res.status(409).json({
          message: "Username already exists",
        });
      }

      if (existingUser.email === email) {
        return res.status(409).json({
          message: "Email already exists",
        });
      }
      if (existingUser.phoneNumber === phoneNumber) {
        return res.status(409).json({
          message: "Phone number already exists",
        });
      }
    }

    // Hash password

    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user    

    const user = await UserModel.create({
      username,
      email,
      password: hashedPassword,
      phoneNumber,
      firstName,
      lastName,
    });

    return res.status(201).json({
      message: "Registration successful",
      userId: user._id,
    });

  } catch (error) {

    // MongoDB duplicate key
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username or email already exists",
      });
    }

    console.error("Registration error:", error);

    return res.status(500).json({
      message: "Internal server error",
    });
  }
};

module.exports = {
  register,
};