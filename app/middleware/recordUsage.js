// middleware/recordUsage.js
const BillingRecord = require('../models/BillingRecord');

const recordUsage = async (userId, totalSize) => {
  const currentDate = new Date();
  const currentHour = new Date(currentDate.setMinutes(0, 0, 0));

  let record = await BillingRecord.findOne({ user_id: userId, date: currentHour });

  if (record) {
    if (totalSize > record.maxUsage) {
      record.maxUsage = totalSize;
      await record.save();
    }
  } else {
    record = new BillingRecord({
      user_id: userId,
      date: currentHour,
      maxUsage: totalSize
    });
    await record.save();
  }
};

module.exports = recordUsage;
