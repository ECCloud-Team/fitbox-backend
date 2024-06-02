const express = require('express');
const mongoose = require("mongoose");
const config = require('./config/config');
const dotenv = require('dotenv');
const cors = require('cors');
const log = require('./middleware/logger'); // Import logger

dotenv.config();


const app = express();

// Enable CORS
app.use(cors());

// Init Middleware
app.use(express.json());

// Define Routes
app.use('/auth', require('./routes/auth'));
app.use('/files', require('./routes/files'));
app.use('/folders', require('./routes/folders'));
app.use('/logs', require('./routes/logs')); // Add logs route

// Set up static folder for file uploads
app.use('/uploads', express.static('uploads'));

mongoose
  .connect(config.mongoURI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });
  

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server started on port ${PORT}`);
});
