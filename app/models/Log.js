const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: false
    },
    message: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: false
    },
    type: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Log', LogSchema);
