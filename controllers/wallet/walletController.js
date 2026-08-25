const WalletModel = require("../../models/Wallet")

const getWalletBalance = async (req, res) => { 
    const user = req.user._id
    try {
        const balance = await WalletModel.findOne({user})

        if (!balance) {
            return res.status(404).json({message: "Wallet not found"})
        }

        res.status(200).json(balance)
    } catch (err) {
        console.error(err)
        res.status(500).json({message: "Error getting user wallet"})
    }
}

module.exports = {getWalletBalance}