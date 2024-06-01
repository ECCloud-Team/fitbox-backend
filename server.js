const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
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

// Define Routes
app.use('/files', require('./routes/files'));
app.use('/folders', require('./routes/folders'));
app.use('/logs', require('./routes/logs')); // Add logs route

// Set up static folder for file uploads
app.use('/uploads', express.static('uploads'));

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    log(`Server started on port ${PORT}`);
    console.log(`Server started on port ${PORT}`);
});
