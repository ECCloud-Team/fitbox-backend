// models/BillingRecord.js
const mongoose = require('mongoose');

const BillingRecordSchema = new mongoose.Schema({
  user_id: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  maxUsage: {
    type: Number,
    required: true
  }
});

BillingRecordSchema.index({ user_id: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('BillingRecord', BillingRecordSchema);