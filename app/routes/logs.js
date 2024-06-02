const express = require('express');
const Log = require('../models/Log');
const router = express.Router();

// @route   GET /logs
// @desc    Get all logs
// @access  Public
router.get('/', async (req, res) => {
    try {
        const logs = await Log.find().sort({ timestamp: -1 }); // Sort logs by timestamp
        res.json(logs);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
