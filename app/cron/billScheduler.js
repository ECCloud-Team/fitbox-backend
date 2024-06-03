// cron/billScheduler.js
const cron = require('node-cron');
const BillingRecord = require('../models/BillingRecord');
const MonthlyBill = require('../models/MonthlyBill');

const calculateMonthlyBill = async () => {
  const users = await BillingRecord.distinct('user_id');
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  for (const userId of users) {
    const records = await BillingRecord.find({
      user_id: userId,
      date: { $gte: new Date(`${currentMonth}-01`), $lt: new Date(`${currentMonth}-31`) }
    });

    const totalCost = records.reduce((sum, record) => sum + record.maxUsage, 0) * 1; // Assuming Rp 1 per GB

    const monthlyBill = new MonthlyBill({
      user_id: userId,
      month: currentMonth,
      totalCost
    });

    await monthlyBill.save();
  }
};

cron.schedule('0 0 1 * *', calculateMonthlyBill, {
  scheduled: true,
  timezone: 'Asia/Jakarta'
});
