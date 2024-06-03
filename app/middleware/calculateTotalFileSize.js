// middleware/calculateTotalFileSize.js
const File = require('../models/File');

const calculateTotalFileSize = async (userId) => {
  const files = await File.find({ user_id: userId });
  return files.reduce((total, file) => total + file.size, 0);
};

module.exports = calculateTotalFileSize;
