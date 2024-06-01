// server.js
const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const log = require('./middleware/logger'); // Import logger

dotenv.config();

const app = express();

// Connect Database
connectDB().then(() => {
    log('MongoDB connected...');
}).catch(err => {
    log(`MongoDB connection error: ${err.message}`);
});

// Enable CORS
app.use(cors());

// Init Middleware
app.use(express.json());

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Define Routes
app.use('/files', require('./routes/files'));
app.use('/folders', require('./routes/folders'));

// Set up static folder for file uploads
app.use('/uploads', express.static('uploads'));

// Route for getting log content
app.get('/logs', (req, res) => {
    const logFilePath = path.join(__dirname, 'logs', 'app.log');
    fs.readFile(logFilePath, 'utf8', (err, data) => {
        if (err) {
            console.error(`Error reading log file: ${err.message}`);
            return res.status(500).send('Server Error');
        }
        res.setHeader('Content-Type', 'text/plain');
        res.send(data);
    });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    log(`Server started on port ${PORT}`);
    console.log(`Server started on port ${PORT}`);
});
