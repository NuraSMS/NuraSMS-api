const UserModel = require("../../models/User");
const WalletModel = require("../../models/Wallet");
const VirtualAccountModel = require("../../models/VirtualAccounts");

const getUsers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const { search, isSuspended } = req.query;

    const filter = {};

    if (search) {
      const regex = new RegExp(search.trim(), "i");
      filter.$or = [
        { username: regex },
        { email: regex },
        { phoneNumber: regex },
        { firstName: regex },
        { lastName: regex },
      ];
    }

    if (isSuspended !== undefined) {
      filter.isSuspended = isSuspended === "true";
    }

    const [users, total] = await Promise.all([
      UserModel.find(filter)
        .select("-password -refreshToken -resetPasswordToken -resetPasswordExpires")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      UserModel.countDocuments(filter),
    ]);

    return res.status(200).json({
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Admin get users error:", error);

    return res.status(500).json({ message: "Unable to retrieve users" });
  }
};

const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findById(id).select(
      "-password -refreshToken -resetPasswordToken -resetPasswordExpires",
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const [wallet, virtualAccount] = await Promise.all([
      WalletModel.findOne({ user: id }),
      VirtualAccountModel.findOne({ user: id }),
    ]);

    return res.status(200).json({
      user,
      wallet: wallet || null,
      virtualAccount: virtualAccount || null,
    });
  } catch (error) {
    console.error("Admin get user error:", error);

    return res.status(500).json({ message: "Unable to retrieve user" });
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstName, lastName, email, phoneNumber, username } = req.body;

    const updates = {};
    if (firstName !== undefined) updates.firstName = firstName.trim();
    if (lastName !== undefined) updates.lastName = lastName.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();
    if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
    if (username !== undefined) updates.username = username.trim().toLowerCase();

    const user = await UserModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select("-password -refreshToken -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User updated", user });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "Username, email, or phone number already in use" });
    }

    console.error("Admin update user error:", error);

    return res.status(500).json({ message: "Unable to update user" });
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted" });
  } catch (error) {
    console.error("Admin delete user error:", error);

    return res.status(500).json({ message: "Unable to delete user" });
  }
};

const suspendUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await UserModel.findByIdAndUpdate(
      id,
      { isSuspended: true, suspendedReason: reason || null },
      { new: true },
    ).select("-password -refreshToken -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User suspended", user });
  } catch (error) {
    console.error("Admin suspend user error:", error);

    return res.status(500).json({ message: "Unable to suspend user" });
  }
};

const unsuspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await UserModel.findByIdAndUpdate(
      id,
      { isSuspended: false, suspendedReason: null },
      { new: true },
    ).select("-password -refreshToken -resetPasswordToken -resetPasswordExpires");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User unsuspended", user });
  } catch (error) {
    console.error("Admin unsuspend user error:", error);

    return res.status(500).json({ message: "Unable to unsuspend user" });
  }
};

module.exports = {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
  suspendUser,
  unsuspendUser,
};
