const cron = require('node-cron');
const User = require('../models/User');
const recordUsage = require('../middleware/recordUsage');
const calculateTotalFileSize = require('../middleware/calculateTotalFileSize');

// Schedule task to run every hour
cron.schedule('0 * * * *', async () => {
  try {
    console.log('Running hourly billing record update');
    const users = await User.find();

    for (const user of users) {
      const totalSize = await calculateTotalFileSize(user._id);
      await recordUsage(user._id, totalSize);
    }

    console.log('Billing record update completed');
  } catch (err) {
    console.error('Error running billing record update', err);
  }
});
