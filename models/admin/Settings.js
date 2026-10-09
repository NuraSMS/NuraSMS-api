const mongoose = require("mongoose");
const { Schema } = mongoose;

const settingsSchema = new Schema(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    markupAmount: { type: Number, default: null },
    usdNgnRate: { type: Number, default: null },
    fivesimOperator: { type: String, default: null },
    updatedBy: { type: Schema.Types.ObjectId, ref: "Admin", default: null },
  },
  { timestamps: true },
);

const SettingsModel = mongoose.model("AdminSettings", settingsSchema);
module.exports = SettingsModel;
