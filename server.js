const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

dotenv.config();

const app = express();

// Connect Database
connectDB();

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

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
