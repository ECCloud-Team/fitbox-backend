// routes/billing.js
const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const BillingRecord = require("../models/BillingRecord");
const MonthlyBill = require("../models/MonthlyBill");
const calculateTotalBilling = require("../middleware/calculateTotalBilling");
const User = require("../models/User");

router.get("/hourly-usage", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const records = await BillingRecord.find({ user_id: userId });
    res.json(records);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /billing/total
// @desc    Get total billing for the user
// @access  Public
router.get("/total", auth, async (req, res) => {
  const userId = req.user.id;
  const {userPlan} = await User.findById(req.user.id)
  try {
    const { totalRecords, planPrice, totalBilling } =
      await calculateTotalBilling(userId, userPlan);
    res.json({
      totalRecords: totalRecords,
      planPrice: planPrice,
      totalBilling: totalBilling,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

router.get("/monthly-bill", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const bills = await MonthlyBill.find({ user_id: userId });
    res.json(bills);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
