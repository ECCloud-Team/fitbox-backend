const express = require("express");
const multer = require("multer");
const File = require("../models/File");
const log = require('../middleware/logger'); // Import logger
const router = express.Router();
const path = require("path");
const fs = require("fs");

// Set up Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "uploads/";
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// Fungsi untuk menghitung total ukuran file
const getTotalFileSize = async (user_id) => {
  const files = await File.find({ user_id });
  return files.reduce((total, file) => total + file.size, 0);
};

// @route   POST /files/upload
// @desc    Upload a file
// @access  Public
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { user_id, folder_id } = req.body;
    var folderId 
    if (folder_id === "") {
      folderId = null;
    } else {
      folderId = folder_id;
    }

    const file = new File({
      user_id,
      filename: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      folder_id: folderId,
    });
    await file.save();
    log(`File uploaded: ${file.filename} (${file.size} bytes) by user ${user_id} in folder ${folder_id || 'root'}`, 'POST', user_id, file.size);
    res.json(file);
  } catch (err) {
    log(`File upload error: ${err.message}`, 'POST', req.body.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// get a file by id
// @route   GET /files/file/:id
// @desc    Get a file by id
// @access  Public
router.get("/file/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found: ${req.params.id}`, 'GET', req.body.user_id);
      return res.status(404).json({ msg: "File not found" });
    }
    log(`File retrieved: ${file.filename} by user ${file.user_id}`, 'GET', file.user_id, file.size);
    res.json(file);
  } catch (err) {
    log(`Get file error: ${err.message}`, 'GET', req.body.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// get all files in root folder
// @route   GET /files/root/:user_id
// @desc    Get all files in root folder
// @access  Public
router.get("/root/:user_id", async (req, res) => {
  try {
    const files = await File.find({
      user_id: req.params.user_id,
      folder_id: null,
    });
    log(`Files in root folder retrieved for user ${req.params.user_id}`, 'GET', req.params.user_id);
    res.json(files);
  } catch (err) {
    log(`Get root files error: ${err.message}`, 'GET', req.params.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /files/:user_id
// @desc    Get all files for a user
// @access  Public
router.get("/:user_id", async (req, res) => {
  try {
    const files = await File.find({ user_id: req.params.user_id });
    const totalSize = await getTotalFileSize(req.params.user_id);
    log(`All files retrieved for user ${req.params.user_id}. Total size: ${totalSize} bytes`, 'GET', req.params.user_id, totalSize);
    res.json({ files, totalSize });
  } catch (err) {
    log(`Get user files error: ${err.message}`, 'GET', req.params.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// download file
// @route   GET /files/download/:id
// @desc    Download a file
// @access  Public
router.get("/download/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found for download: ${req.params.id}`, 'GET', req.body.user_id);
      return res.status(404).json({ msg: "File not found" });
    }
    log(`File downloaded: ${file.filename} by user ${file.user_id}`, 'GET', file.user_id, file.size);
    res.download(file.path, file.filename);
  } catch (err) {
    log(`Download file error: ${err.message}`, 'GET', req.body.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /files/:id
// @desc    Delete a file
// @access  Public
router.delete("/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found for deletion: ${req.params.id}`, 'DELETE', req.body.user_id);
      return res.status(404).json({ msg: "File not found" });
    }

    // Path to the file in storage (modify according to your storage path)
    const filePath = path.join(__dirname, "../", file.path);

    // Delete the file from storage
    fs.unlink(filePath, async (err) => {
      if (err) {
        log(`File deletion error: ${err.message}`, 'DELETE', req.body.user_id);
        console.error(err.message);
        return res.status(500).send("Server Error");
      }

      // Remove the file document from the database
      await File.deleteOne({ _id: req.params.id });

      log(`File deleted: ${file.filename} by user ${file.user_id}`, 'DELETE', file.user_id, file.size);
      res.json({ msg: "File removed" });
    });
  } catch (err) {
    log(`Delete file error: ${err.message}`, 'DELETE', req.body.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /files/rename/:id
// @desc    Update a file
// @access  Public
router.put("/rename/:id", async (req, res) => {
  try {
    const { filename } = req.body;
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found for renaming: ${req.params.id}`, 'PUT', req.body.user_id);
      return res.status(404).json({ msg: "File not found" });
    }
    // Extract the file extension from the current filename
    const ext = path.extname(file.filename);
    // Create the new filename with the same extension
    const newFilename = `${filename}${ext}`;
    file.filename = newFilename;
    await file.save();
    log(`File renamed to: ${newFilename} by user ${file.user_id}`, 'PUT', file.user_id, file.size);
    res.json(file);
  } catch (err) {
    log(`Rename file error: ${err.message}`, 'PUT', req.body.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /files/folder/:folder_id
// @desc    Get all files in a folder
// @access  Public
router.get("/folder/:folder_id", async (req, res) => {
  try {
    const files = await File.find({ folder_id: req.params.folder_id });
    log(`Files retrieved in folder: ${req.params.folder_id}`, 'GET', req.body.user_id);
    res.json(files);
  } catch (err) {
    log(`Get files in folder error: ${err.message}`, 'GET', req.body.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /files/folder/:folder_id
// @desc    Delete all files in a folder
// @access  Public
router.delete("/folder/:folder_id", async (req, res) => {
  try {
    await File.deleteMany({ folder_id: req.params.folder_id });
    log(`All files deleted in folder: ${req.params.folder_id}`, 'DELETE', req.body.user_id);
    res.json({ msg: "Files removed" });
  } catch (err) {
    log(`Delete files in folder error: ${err.message}`, 'DELETE', req.body.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /files/:id/folder/:folder_id
// @desc    Move a file in a folder to another folder
// @access  Public
router.put("/:id/folder/:folder_id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found for moving: ${req.params.id}`, 'PUT', req.body.user_id);
      return res.status(404).json({ msg: "File not found" });
    }
    file.folder_id = req.params.folder_id;
    await file.save();
    log(`File moved to folder: ${req.params.folder_id} by user ${file.user_id}`, 'PUT', file.user_id, file.size);
    res.json(file);
  } catch (err) {
    log(`Move file error: ${err.message}`, 'PUT', req.body.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /files/folder/:folder_id
// @desc    Move all files in a folder to another folder
// @access  Public
router.put("/folder/:folder_id", async (req, res) => {
  try {
    const { new_folder_id } = req.body;
    await File.updateMany(
      { folder_id: req.params.folder_id },
      { folder_id: new_folder_id }
    );
    log(`All files moved to folder: ${new_folder_id}`, 'PUT', req.body.user_id);
    res.json({ msg: "Files moved" });
  } catch (err) {
    log(`Move files in folder error: ${err.message}`, 'PUT', req.body.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /files/folder/:folder_id/file/:id
// @desc    Delete a file in a folder
// @access  Public
router.delete("/folder/:folder_id/file/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found for deletion in folder: ${req.params.id}`, 'DELETE', req.body.user_id);
      return res.status(404).json({ msg: "File not found" });
    }
    await file.remove();
    log(`File removed from folder: ${req.params.folder_id} by user ${file.user_id}`, 'DELETE', file.user_id, file.size);
    res.json({ msg: "File removed" });
  } catch (err) {
    log(`Delete file in folder error: ${err.message}`, 'DELETE', req.body.user_id);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
