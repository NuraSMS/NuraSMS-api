const UserModel = require("../../models/User");
const VirtualAccountModel = require("../../models/VirtualAccounts");
const genVirtualAccount = require("../../services/wallet/genVirtualAccount");

const createVirtualAccount = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const account = await genVirtualAccount(user);

    return res.status(200).json({
      account,
    });
  } catch (err) {
    console.error(
      "Create virtual account error:",
      err.response?.data || err.message
    );

    return res.status(500).json({
      message: "Account creation failed",
    });
  }
};

const getVirtualAccount = async (req, res) => {
  const user = req.user.id

  // console.log(user)

  try {
    const account = await VirtualAccountModel.findOne({user})
    if (!account) {
      return res.status(404).json({message: "No assigned VDA"})
    }
    res.status(200).json(account)

  } catch (err) {
    console.error(err)
    res.status(500).json({message:"Error getting account details"}) 
  }
}

module.exports = {createVirtualAccount, getVirtualAccount}