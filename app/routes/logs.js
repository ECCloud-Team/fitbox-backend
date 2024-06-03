const express = require("express");
const Log = require("../models/Log");
const router = express.Router();
const auth = require("../middleware/auth");

// @route   GET /logs
// @desc    Get all logs
// @access  Public
router.get("/user", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const logs = await Log.find({ user_id: userId }).sort({ timestamp: -1 }); // Sort logs by timestamp
    res.json(logs);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
