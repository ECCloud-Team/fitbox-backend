const express = require("express");
const multer = require("multer");
const File = require("../models/File");
const Folder = require("../models/Folder");
const log = require("../middleware/logger"); // Import logger
const router = express.Router();
const path = require("path");
const fs = require("fs");
const auth = require("../middleware/auth");
const calculateTotalFileSize = require("../middleware/calculateTotalFileSize");
const recordUsage = require("../middleware/recordUsage");

// Set up Multer for file storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = "app/uploads/";
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
const upload = multer({ storage });

// // Fungsi untuk menghitung total ukuran file
// const getTotalFileSize = async (user_id) => {
//   const files = await File.find({ user_id });
//   return files.reduce((total, file) => total + file.size, 0);
// };

// @route   POST /files/upload
// @desc    Upload a file
// @access  Public
router.post("/upload", auth, upload.single("file"), async (req, res) => {
  const userId = req.user.id;
  try {
    const { folder_id } = req.body;
    const user_id = req.user.id;

    var folderId;
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
    // Update total file size for the user
    const totalSize = await calculateTotalFileSize(userId);

    // Record the usage
    await recordUsage(userId, totalSize);
    log(
      `File uploaded: ${file.filename} (${
        file.size
      } bytes) by user ${user_id} in folder ${folder_id || "root"}`,
      "POST",
      user_id,
      file.size
    );
    res.json(file);
  } catch (err) {
    log(`File upload error: ${err.message}`, "POST", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// get a file by id
// @route   GET /files/file/:id
// @desc    Get a file by id
// @access  Public
router.get("/file/:id", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found: ${req.params.id}`, "GET", userId);
      return res.status(404).json({ msg: "File not found" });
    }
    log(
      `File retrieved: ${file.filename} by user ${userId}`,
      "GET",
      userId,
      file.size
    );
    res.json(file);
  } catch (err) {
    log(`Get file error: ${err.message}`, "GET", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// get all files in root folder
// @route   GET /files/root/:user_id
// @desc    Get all files in root folder
// @access  Public
router.get("/root", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const files = await File.find({
      user_id: userId,
      folder_id: null,
    });
    log(`Files in root folder retrieved for user ${userId}`, "GET", userId);
    res.json(files);
  } catch (err) {
    log(`Get root files error: ${err.message}`, "GET", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /files/:user_id
// @desc    Get all files for a user
// @access  Public
router.get("/", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const files = await File.find({ user_id: userId });
    const totalSize = await getTotalFileSize(userId);
    res.json({ files, totalSize });
  } catch (err) {
    log(`Get user files error: ${err.message}`, "GET", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// download file
// @route   GET /files/download/:id
// @desc    Download a file
// @access  Public
router.get("/download/:id", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found for download: ${req.params.id}`, "GET", userId);
      return res.status(404).json({ msg: "File not found" });
    }
    log(
      `File downloaded: ${file.filename} by user ${userId}`,
      "GET",
      userId,
      file.size
    );
    res.download(file.path, file.filename);
  } catch (err) {
    log(`Download file error: ${err.message}`, "GET", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /files/:id
// @desc    Delete a file
// @access  Public
router.delete("/delete/:id", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found for deletion: ${req.params.id}`, "DELETE", userId);
      return res.status(404).json({ msg: "File not found" });
    }

    // Path to the file in storage (modify according to your storage path)
    const filePath = path.join(__dirname, "../../", file.path);

    // Delete the file from storage
    fs.unlink(filePath, async (err) => {
      if (err) {
        log(`File deletion error: ${err.message}`, "DELETE", userId);
        console.error(err.message);
        return res.status(500).send("Server Error");
      }

      // Remove the file document from the database
      await File.deleteOne({ _id: req.params.id });

      // Update total file size for the user
      const totalSize = await calculateTotalFileSize(userId);

      // Record the usage
      await recordUsage(userId, totalSize);

      log(
        `File deleted: ${file.filename} by user ${userId}`,
        "DELETE",
        userId,
        file.size
      );
      res.json({ msg: "File removed" });
    });
  } catch (err) {
    log(`Delete file error: ${err.message}`, "DELETE", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /files/rename/:id
// @desc    Update a file
// @access  Public
router.put("/rename/:id", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const { filename } = req.body;
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found for renaming: ${req.params.id}`, "PUT", userId);
      return res.status(404).json({ msg: "File not found" });
    }
    // Extract the file extension from the current filename
    const ext = path.extname(file.filename);
    // Create the new filename with the same extension
    const newFilename = `${filename}${ext}`;
    file.filename = newFilename;
    await file.save();
    // Update total file size for the user
    const totalSize = await calculateTotalFileSize(userId);
    log(
      `File renamed to: ${newFilename} by user ${userId}`,
      "PUT",
      userId,
      file.size
    );
    res.json(file);
  } catch (err) {
    log(`Rename file error: ${err.message}`, "PUT", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /files/total-size
// @desc    Get total file size for a user
// @access  Private
router.get("/total-size", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const totalSize = await calculateTotalFileSize(userId);
    log(`Total file size retrieved for user: ${userId}`, "GET", userId);
    res.json({ totalSize });
  } catch (err) {
    log(`Get total file size error: ${err.message}`, "GET", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /files/terminate
// @desc    Delete all files and folders for the user
// @access  Public
router.delete("/terminate", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    // Find all files and folders for the user
    const files = await File.find({ user_id: userId });
    const folders = await Folder.find({ user_id: userId });

    // Delete all files from storage
    for (const file of files) {
      const filePath = path.join(__dirname, "../../", file.path);
      await new Promise((resolve, reject) => {
        fs.unlink(filePath, async (err) => {
          if (err) {
            log(`File deletion error: ${err.message}`, "DELETE", userId);
            console.error(err.message);
            reject(err);
          } else {
            resolve();
          }
        });
      });
    }
    // Remove the file document from the database
    await File.deleteMany({ user_id: userId });
    await Folder.deleteMany({ user_id: userId });

    // Update total file size for the user
    const totalSize = await calculateTotalFileSize(userId);

    // Record the usage
    await recordUsage(userId, totalSize);
  } catch (err) {
    log(`Delete all files error: ${err.message}`, "DELETE", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   GET /files/folder/:folder_id
// @desc    Get all files in a folder
// @access  Public
router.get("/folder/:folder_id", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const files = await File.find({ folder_id: req.params.folder_id });
    log(`Files retrieved in folder: ${req.params.folder_id}`, "GET", userId);
    res.json(files);
  } catch (err) {
    log(`Get files in folder error: ${err.message}`, "GET", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /files/folder/:folder_id
// @desc    Delete all files in a folder
// @access  Public
router.delete("/folder/:folder_id", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    await File.deleteMany({ folder_id: req.params.folder_id });
    log(
      `All files deleted in folder: ${req.params.folder_id}`,
      "DELETE",
      userId
    );
    res.json({ msg: "Files removed" });
  } catch (err) {
    log(`Delete files in folder error: ${err.message}`, "DELETE", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /files/:id/folder/:folder_id
// @desc    Move a file in a folder to another folder
// @access  Public
router.put("/:id/folder/:folder_id", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      log(`File not found for moving: ${req.params.id}`, "PUT", userId);
      return res.status(404).json({ msg: "File not found" });
    }
    file.folder_id = req.params.folder_id;
    await file.save();
    log(
      `File moved to folder: ${req.params.folder_id} by user ${userId}`,
      "PUT",
      userId,
      file.size
    );
    res.json(file);
  } catch (err) {
    log(`Move file error: ${err.message}`, "PUT", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   PUT /files/folder/:folder_id
// @desc    Move all files in a folder to another folder
// @access  Public
router.put("/folder/:folder_id", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const { new_folder_id } = req.body;
    await File.updateMany(
      { folder_id: req.params.folder_id },
      { folder_id: new_folder_id }
    );
    log(`All files moved to folder: ${new_folder_id}`, "PUT", userId);
    res.json({ msg: "Files moved" });
  } catch (err) {
    log(`Move files in folder error: ${err.message}`, "PUT", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// @route   DELETE /files/folder/:folder_id/file/:id
// @desc    Delete a file in a folder
// @access  Public
router.delete("/folder/:folder_id/file/:id", auth, async (req, res) => {
  const userId = req.user.id;
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      log(
        `File not found for deletion in folder: ${req.params.id}`,
        "DELETE",
        userId
      );
      return res.status(404).json({ msg: "File not found" });
    }
    await file.remove();
    log(
      `File removed from folder: ${req.params.folder_id} by user ${userId}`,
      "DELETE",
      userId,
      file.size
    );
    res.json({ msg: "File removed" });
  } catch (err) {
    log(`Delete file in folder error: ${err.message}`, "DELETE", userId);
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
