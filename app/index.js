const express = require("express");
const mongoose = require("mongoose");
const config = require("./config/config");
const dotenv = require("dotenv");
const cors = require("cors");
const log = require("./middleware/logger"); // Import logger
const { wss } = require("./utils/websocket"); // Import websocket
const http = require("http");

dotenv.config();

const app = express();
const server = http.createServer(app); // Create HTTP server

// Enable CORS
app.use(cors());

// Init Middleware
app.use(express.json());

// Define Routes
app.use("/auth", require("./routes/auth"));
app.use("/files", require("./routes/files"));
app.use("/folders", require("./routes/folders"));
app.use("/logs", require("./routes/logs")); // Add logs route
app.use("/billing", require("./routes/billing"));

// Set up static folder for file uploads
app.use("/uploads", express.static("uploads"));

// Initialize cron job
require("./cron/recordUsageCron");
require("./cron/billScheduler");

mongoose
  .connect(config.mongoURI)
  .then(() => {
    console.log("MongoDB connected");
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1);
  });

// Integrate WebSocket server with HTTP server
server.on("upgrade", (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
