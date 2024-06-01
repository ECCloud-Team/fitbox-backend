const fs = require('fs');
const path = require('path');
const Log = require('../models/Log'); // Import Log model

// Membuat folder logs jika belum ada
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const logFile = path.join(logDirectory, 'app.log');

// Fungsi untuk mencatat log
const log = (message, type, user_id = null, size = null) => {
    if (!type) {
        console.error('Log type is required');
        return;
    }

    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}`;

    // Tulis pesan ke file log dengan menambahkan newline
    fs.appendFileSync(logFile, `${logMessage}\n`);

    // Simpan log ke MongoDB tanpa newline
    const logEntry = new Log({ user_id, message: logMessage, size, type });
    logEntry.save().catch(err => console.error('Failed to save log to MongoDB', err));
};

module.exports = log;
