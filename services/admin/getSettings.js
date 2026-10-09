const SettingsModel = require("../../models/admin/Settings");

// Merges DB-stored overrides (set via the admin panel) with .env defaults.
const getSettings = async () => {
  const settings = await SettingsModel.findOne({ key: "global" }).lean();

  return {
    markupAmount: settings?.markupAmount ?? Number(process.env.NURASMS_MARKUP_AMOUNT || 1100),
    usdNgnRate: settings?.usdNgnRate ?? Number(process.env.NURASMS_USD_NGN_RATE),
    fivesimOperator: settings?.fivesimOperator || process.env.FIVESIM_OPERATOR || "any",
  };
};

module.exports = getSettings;
