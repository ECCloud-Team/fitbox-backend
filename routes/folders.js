const express = require('express');
const Folder = require('../models/Folder');
const File = require('../models/File');
const router = express.Router();

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
        res.json(folder);
    } catch (err) {
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
        res.json({ folders, files });
    } catch (err) {
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
            return res.status(404).json({ msg: 'Folder not found' });
        }
        // Remove files in the folder
        await File.deleteMany({ folder_id: folder._id });
        // Remove subfolders
        await Folder.deleteMany({ parent_id: folder._id });
        await folder.remove();
        res.json({ msg: 'Folder removed' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;

