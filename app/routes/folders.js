const express = require('express');
const Folder = require('../models/Folder');
const File = require('../models/File');
const log = require('../middleware/logger'); // Import logger
const multer = require('multer');
const router = express.Router();
const auth = require('../middleware/auth');

// Konfigurasi Multer untuk menangani form-data
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Recursive function to build the folder tree
const buildFolderTree = async (userId, parentId = null) => {
    const folders = await Folder.find({ user_id: userId, parent_id: parentId });
    const folderTree = [];

    for (const folder of folders) {
        const files = await File.find({ folder_id: folder._id });
        const subFolders = await buildFolderTree(userId, folder._id);

        folderTree.push({
            ...folder.toObject(),
            files,
            subFolders
        });
    }

    return folderTree;
};

// @route   POST /folders
// @desc    Create a new folder
// @access  Public
router.post('/', auth, upload.none(), async (req, res) => {
    const userId = req.user.id
    try {
        const { name, parent_id } = req.body;
        const folder = new Folder({
            user_id: userId,
            name,
            parent_id: parent_id || null
        });
        await folder.save();
        log(`Folder created: ${folder.name} by user ${userId} in parent folder ${parent_id || 'root'}`, 'POST', userId);
        res.json(folder);
    } catch (err) {
        log(`Folder creation error: ${err.message}`, 'POST', userId);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /folders/folder/:id
// @desc    Get a folder by id
// @access  Public
router.get('/folder/:id', auth, async (req, res) => {
    const userId = req.user.id
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) {
            log(`Folder not found: ${req.params.id}`, 'GET', userId);
            return res.status(404).json({ msg: 'Folder not found' });
        }
        log(`Folder retrieved: ${folder.name} by user ${userId}`, 'GET', userId);
        res.json(folder);
    } catch (err) {
        log(`Get folder error: ${err.message}`, 'GET', userId);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// rename folder by id
// @route   PUT /folders/rename/:id
// @desc    Rename a folder by id
// @access  Public
router.put('/rename/:id', auth, async (req, res) => {
    const userId = req.user.id
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) {
            log(`Folder not found for renaming: ${req.params.id}`, 'PUT', userId);
            return res.status(404).json({ msg: 'Folder not found' });
        }
        folder.name = req.body.name;
        await folder.save();
        log(`Folder renamed to: ${folder.name} by user ${userId}`, 'PUT', userId);
        res.json(folder);
    } catch (err) {
        log(`Rename folder error: ${err.message}`, 'PUT', userId);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /folders/:user_id
// @desc    Get all folders and files for a user
// @access  Public
router.get('/', auth, async (req, res) => {
    const userId = req.user.id
    try {
        const folders = await Folder.find({ user_id: userId });
        const files = await File.find({ user_id: userId });
        log(`All folders and files retrieved for user ${userId}`, 'GET', userId);
        res.json({ folders, files });
    } catch (err) {
        log(`Get all folders and files error: ${err.message}`, 'GET', userId);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /folders/:id
// @desc    Delete a folder
// @access  Public
router.delete('/:id',auth, async (req, res) => {
    const userId = req.user.id
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) {
            log(`Folder not found for deletion: ${req.params.id}`, 'DELETE', userId);
            return res.status(404).json({ msg: 'Folder not found' });
        }
        // Remove files in the folder
        await File.deleteMany({ folder_id: folder._id });
        // Remove subfolders
        await Folder.deleteMany({ parent_id: folder._id });
        // Remove the folder itself
        await Folder.deleteOne({ _id: folder._id });
        log(`Folder and its contents deleted: ${folder.name} by user ${userId}`, 'DELETE', userId);
        res.json({ msg: 'Folder removed' });
    } catch (err) {
        log(`Delete folder error: ${err.message}`, 'DELETE', userId);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// make backend for make tree folder and file in json by folder_id and parent_id that user have
// @route   GET /folders/folder-tree/:user_id
// @desc    Get all folders and files for a user
// @access  Public
router.get('/folder-tree/', auth, async (req, res) => {
    const userId = req.user.id
    try {
        const folderTree = await buildFolderTree(userId);
        log(`Folder tree retrieved for user: ${userId}`, 'GET', userId);
        res.json(folderTree);
    } catch (err) {
        log(`Get folder tree error: ${err.message}`, 'GET', userId);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// get all folder in parent_id
// @route   GET /folders/parent/:parent_id
// @desc    Get all folders in a parent folder
// @access  Public
router.get('/parent/:parent_id', auth, async (req, res) => {
    const userId = req.user.id
    try {
        const folders = await Folder.find({ parent_id: req.params.parent_id });
        log(`Folders retrieved for parent: ${req.params.parent_id}`, 'GET', userId);
        res.json(folders);
    } catch (err) {
        log(`Get folders in parent error: ${err.message}`, 'GET', userId);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// get all folder in root
// @route   GET /folders/root/:user_id
// @desc    Get all folders in root folder
// @access  Public
router.get('/root/', auth, async (req, res) => {
    const userId = req.user.id
    try {
        const folders = await Folder.find({ user_id: userId, parent_id: null });
        log(`Root folders retrieved for user: ${userId}`, 'GET', userId);
        res.json(folders);
    } catch (err) {
        log(`Get root folders error: ${err.message}`, 'GET', userId);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
