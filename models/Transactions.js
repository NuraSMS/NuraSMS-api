const mongoose = require("mongoose");
const { Schema } = mongoose;

const transactionSchema = new Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    type: { type: String, enum: ["credit", "debit"], required: true },
    amount: { type: Number, required: true },
    reference: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "success", "failed"],
      default: "pending",
    },
    previousBalance: { type: Number },
    currentBalance: { type: Number },
    meta: { type: Object },
    description: String,
  },
  { timestamps: true },
);

const TransactionModel = mongoose.model("Transaction", transactionSchema);
module.exports = TransactionModel;