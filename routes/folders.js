// routes/folders.js
const express = require('express');
const Folder = require('../models/Folder');
const File = require('../models/File');
const log = require('../middleware/logger'); // Import logger
const router = express.Router();

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
router.post('/', async (req, res) => {
    try {
        const { user_id, name, parent_id } = req.body;
        const folder = new Folder({
            user_id,
            name,
            parent_id: parent_id || null
        });
        await folder.save();
        log(`Folder created: ${folder.name} by user ${user_id}`);
        res.json(folder);
    } catch (err) {
        log(`Folder creation error: ${err.message}`);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /folders/folder/:id
// @desc    Get a folder by id
// @access  Public
router.get('/folder/:id', async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) {
            log(`Folder not found: ${req.params.id}`);
            return res.status(404).json({ msg: 'Folder not found' });
        }
        log(`Folder retrieved: ${folder.name}`);
        res.json(folder);
    } catch (err) {
        log(`Get folder error: ${err.message}`);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// rename folder by id
// @route   PUT /folders/rename/:id
// @desc    Rename a folder by id
// @access  Public
router.put('/rename/:id', async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) {
            log(`Folder not found for renaming: ${req.params.id}`);
            return res.status(404).json({ msg: 'Folder not found' });
        }
        folder.name = req.body.name;
        await folder.save();
        log(`Folder renamed to: ${folder.name}`);
        res.json(folder);
    } catch (err) {
        log(`Rename folder error: ${err.message}`);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /folders/:user_id
// @desc    Get all folders and files for a user
// @access  Public
router.get('/:user_id', async (req, res) => {
    try {
        const folders = await Folder.find({ user_id: req.params.user_id });
        const files = await File.find({ user_id: req.params.user_id });
        log(`All folders and files retrieved for user ${req.params.user_id}`);
        res.json({ folders, files });
    } catch (err) {
        log(`Get all folders and files error: ${err.message}`);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /folders/:id
// @desc    Delete a folder
// @access  Public
router.delete('/:id', async (req, res) => {
    try {
        const folder = await Folder.findById(req.params.id);
        if (!folder) {
            log(`Folder not found for deletion: ${req.params.id}`);
            return res.status(404).json({ msg: 'Folder not found' });
        }
        // Remove files in the folder
        await File.deleteMany({ folder_id: folder._id });
        // Remove subfolders
        await Folder.deleteMany({ parent_id: folder._id });
        // Remove the folder itself
        await Folder.deleteOne({ _id: folder._id });
        log(`Folder and its contents deleted: ${folder.name}`);
        res.json({ msg: 'Folder removed' });
    } catch (err) {
        log(`Delete folder error: ${err.message}`);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// make backend for make tree folder and file in json by folder_id and parent_id that user have
// @route   GET /folders/folder-tree/:user_id
// @desc    Get all folders and files for a user
// @access  Public
router.get('/folder-tree/:user_id', async (req, res) => {
    try {
        const folderTree = await buildFolderTree(req.params.user_id);
        log(`Folder tree retrieved for user: ${req.params.user_id}`);
        res.json(folderTree);
    } catch (err) {
        log(`Get folder tree error: ${err.message}`);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// get all folder in parent_id
// @route   GET /folders/parent/:parent_id
// @desc    Get all folders in a parent folder
// @access  Public
router.get('/parent/:parent_id', async (req, res) => {
    try {
        const folders = await Folder.find({ parent_id: req.params.parent_id });
        log(`Folders retrieved for parent: ${req.params.parent_id}`);
        res.json(folders);
    } catch (err) {
        log(`Get folders in parent error: ${err.message}`);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// get all folder in root
// @route   GET /folders/root/:user_id
// @desc    Get all folders in root folder
// @access  Public
router.get('/root/:user_id', async (req, res) => {
    try {
        const folders = await Folder.find({ user_id: req.params.user_id, parent_id: null });
        log(`Root folders retrieved for user: ${req.params.user_id}`);
        res.json(folders);
    } catch (err) {
        log(`Get root folders error: ${err.message}`);
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
