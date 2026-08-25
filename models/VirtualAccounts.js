const mongoose = require("mongoose");
const { Schema } = mongoose;

const virtualAccountSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true },
    customer: { type: Object, required: true },
    dedicatedAccount: { type: Object, required: true },
  },
  { timestamps: true },
);

const VirtualAccountModel = mongoose.model(
  "VirtualAccounts",
  virtualAccountSchema,
);
module.exports = VirtualAccountModel;