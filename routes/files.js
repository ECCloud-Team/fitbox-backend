const express = require("express");
const multer = require("multer");
const File = require("../models/File");
const router = express.Router();
const { Storage } = require("@google-cloud/storage");
const path = require("path");
const fs = require("fs");

// // Google Cloud Storage setup
// const storage = new Storage({
//   projectId: process.env.GCLOUD_PROJECT_ID,
//   keyFilename: process.env.GCLOUD_KEYFILE_PATH,
// });

// const bucket = storage.bucket(process.env.GCLOUD_BUCKET_NAME);

// // Set up Multer for file storage
// const upload = multer({
//   storage: multer.memoryStorage(),
// });

// // @route   POST /files/upload
// // @desc    Upload a file
// // @access  Public
// router.post("/upload", upload.single("file"), async (req, res) => {
//   try {
//     const { user_id, folder_id } = req.body;

//     if (!req.file) {
//       return res.status(400).send("No file uploaded.");
//     }

//     const fileName = `${Date.now()}-${req.file.originalname}`;
//     const userFolder = `uploads/${user_id}/`;

//     const blob = bucket.file(userFolder + fileName);
//     const blobStream = blob.createWriteStream({
//       resumable: false,
//     });

//     blobStream.on('error', (err) => {
//       console.error(err);
//       res.status(500).send("Server Error");
//     });

//     blobStream.on('finish', async () => {
//       const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`;

//       const file = new File({
//         user_id,
//         filename: req.file.originalname,
//         path: publicUrl,
//         size: req.file.size,
//         folder_id: folder_id || null,
//       });

//       await file.save();
//       res.json(file);
//     });

//     blobStream.end(req.file.buffer);
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send("Server Error");
//   }
// });

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

// @route   POST /files/upload
// @desc    Upload a file
// @access  Public
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { user_id, folder_id } = req.body;
    const file = new File({
      user_id,
      filename: req.file.originalname,
      path: req.file.path,
      size: req.file.size,
      folder_id: folder_id || null,
    });
    await file.save();
    res.json(file);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// get a file by id
// @route   GET /files/file/:id
// @desc    Get a file by id
// @access  Public
router.get("file/:id", async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) {
      return res.status(404).json({ msg: "File not found" });
    }
    res.json(file);
  } catch (err) {
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
    res.json(files);
  } catch (err) {
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
    res.json(files);
  } catch (err) {
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
      return res.status(404).json({ msg: "File not found" });
    }
    res.download(file.path, file.filename);
  } catch (err) {
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
      return res.status(404).json({ msg: "File not found" });
    }

    // Path to the file in storage (modify according to your storage path)
    const filePath = path.join(__dirname, "../", file.path);

    // Delete the file from storage
    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send("Server Error");
      }

      // Remove the file document from the database
      await File.deleteOne({ _id: req.params.id });

      res.json({ msg: "File removed" });
    });
  } catch (err) {
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
      return res.status(404).json({ msg: "File not found" });
    }
    // Extract the file extension from the current filename
    const ext = path.extname(file.filename);
    // Create the new filename with the same extension
    const newFilename = `${filename}${ext}`;
    file.filename = newFilename;
    await file.save();
    res.json(file);
  } catch (err) {
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
    res.json(files);
  } catch (err) {
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
    res.json({ msg: "Files removed" });
  } catch (err) {
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
      return res.status(404).json({ msg: "File not found" });
    }
    file.folder_id = req.params.folder_id;
    await file.save();
    res.json(file);
  } catch (err) {
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
    res.json({ msg: "Files moved" });
  } catch (err) {
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
      return res.status(404).json({ msg: "File not found" });
    }
    await file.remove();
    res.json({ msg: "File removed" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
