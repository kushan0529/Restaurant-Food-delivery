const express = require('express');
const router = express.Router();
const Menuitems = require('../Models/Menuitems');
const { protect, authorize } = require('../Middlewares/authMiddlewares');

// PUBLIC: guests can browse the menu (no token needed)
router.get('/', async (req, res) => {
    try {
        const menuItems = await Menuitems.find({ isAvailable: true });
        res.json(menuItems);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const menuItem = await Menuitems.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        res.json(menuItem);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ADMIN ONLY
router.post('/', protect, authorize('admin'), async (req, res) => {
    const menuItem = new Menuitems({
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        image: req.body.image,
        isAvailable: req.body.isAvailable,
        variants: req.body.variants,
    });
    try {
        const newMenuItem = await menuItem.save();
        res.status(201).json(newMenuItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const menuItem = await Menuitems.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        Object.assign(menuItem, req.body);
        const updatedMenuItem = await menuItem.save();
        res.json(updatedMenuItem);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
    try {
        const menuItem = await Menuitems.findById(req.params.id);
        if (!menuItem) {
            return res.status(404).json({ message: 'Menu item not found' });
        }
        await menuItem.deleteOne();
        res.json({ message: 'Menu item deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;