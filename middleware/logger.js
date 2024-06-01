// middleware/logger.js
const fs = require('fs');
const path = require('path');

// Membuat folder logs jika belum ada
const logDirectory = path.join(__dirname, '../logs');
if (!fs.existsSync(logDirectory)) {
    fs.mkdirSync(logDirectory);
}

const logFile = path.join(logDirectory, 'app.log');

// Fungsi untuk mencatat log
const log = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `${timestamp} - ${message}\n`;
    fs.appendFileSync(logFile, logMessage);
};

module.exports = log;
