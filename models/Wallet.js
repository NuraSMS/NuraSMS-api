const mongoose = require("mongoose");
const { Schema } = mongoose;

const walletSchema = new Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    balance: { type: Number, default: 0 },
    isFrozen: { type: Boolean, default: false },
  },
  { timestamps: true },
);

const WalletModel = mongoose.model("Wallet", walletSchema);
module.exports = WalletModel;