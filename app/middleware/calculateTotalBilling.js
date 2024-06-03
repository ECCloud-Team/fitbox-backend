// middleware/calculateTotalBilling.js
const BillingRecord = require("../models/BillingRecord");

const calculateTotalBilling = async (userId, userPlan) => {
  try {
    const billingRecords = await BillingRecord.find({ user_id: userId });
    let totalRecords = 0;
    let totalBilling = 0;
    let planPrice = 1;
    billingRecords.forEach((record) => {
      totalRecords += record.maxUsage;
      if (userPlan == "basic") {
        totalBilling += (record.maxUsage * 1) / (1024 * 1024 * 1024);
        planPrice = 1;
      } else if (userPlan == "premium") {
        totalBilling += (record.maxUsage * 2) / (1024 * 1024 * 1024);
        planPrice = 2;
      } else if (userPlan == "enterprise") {
        totalBilling += (record.maxUsage * 3) / (1024 * 1024 * 1024);
        planPrice = 3;
      }
    });
    return { totalRecords, planPrice, totalBilling };
  } catch (err) {
    console.error("Error calculating total billing:", err);
    throw new Error("Error calculating total billing");
  }
};

module.exports = calculateTotalBilling;
