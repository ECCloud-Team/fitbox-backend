const mongoose = require('mongoose');

const LogSchema = new mongoose.Schema({
    user_id: {
        type: String,
        required: false // Mengubah menjadi opsional (teradi validation err jika 'true')
    },
    message: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Log', LogSchema);
