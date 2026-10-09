const SettingsModel = require("../../models/admin/Settings");
const getSettings = require("../../services/admin/getSettings");

const getPlatformSettings = async (req, res) => {
  try {
    const settings = await getSettings();

    return res.status(200).json({ settings });
  } catch (error) {
    console.error("Admin get settings error:", error);

    return res.status(500).json({ message: "Unable to retrieve settings" });
  }
};

const updatePlatformSettings = async (req, res) => {
  try {
    const { markupAmount, usdNgnRate, fivesimOperator } = req.body;

    const updates = { updatedBy: req.admin.id };

    if (markupAmount !== undefined) {
      if (Number(markupAmount) < 0) {
        return res.status(400).json({ message: "markupAmount must be a positive number" });
      }
      updates.markupAmount = Number(markupAmount);
    }

    if (usdNgnRate !== undefined) {
      if (Number(usdNgnRate) <= 0) {
        return res.status(400).json({ message: "usdNgnRate must be a positive number" });
      }
      updates.usdNgnRate = Number(usdNgnRate);
    }

    if (fivesimOperator !== undefined) {
      updates.fivesimOperator = String(fivesimOperator).trim();
    }

    const settings = await SettingsModel.findOneAndUpdate(
      { key: "global" },
      updates,
      { new: true, upsert: true, runValidators: true },
    );

    return res.status(200).json({ message: "Settings updated", settings });
  } catch (error) {
    console.error("Admin update settings error:", error);

    return res.status(500).json({ message: "Unable to update settings" });
  }
};

module.exports = { getPlatformSettings, updatePlatformSettings };
