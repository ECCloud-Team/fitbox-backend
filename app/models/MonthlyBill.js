
const mongoose = require('mongoose');
// models/MonthlyBill.js
const MonthlyBillSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  month: {
    type: String,
    required: true
  },
  totalCost: {
    type: Number,
    required: true
  }
});

module.exports = mongoose.model('MonthlyBill', MonthlyBillSchema);