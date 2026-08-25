const VirtualAccountModel = require("../../models/VirtualAccounts");
const genVirtualAccount = require("../../services/wallet/genVirtualAccount");

const createVirtualAccount = async (req, res) => {
  const user  = req.user;
  console.log(user)
  try {
    const account = await genVirtualAccount(user);

    res.status(200).json({ account });
  } catch (err) {
    res.status(500).json({
      message: "Account creation failed",
    });
  }
};

const getVirtualAccount = async (req, res) => {
  const user = req.user._id

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