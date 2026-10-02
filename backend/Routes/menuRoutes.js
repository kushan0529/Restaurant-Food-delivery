const express = require('express');
const router = express.Router();
const Menuitems = require('../Models/Menuitems');
const { protect, authorize } = require('../Middlewares/authMiddlewares');
const upload = require('../Middlewares/upload');
const { cloudinary, uploadBuffer } = require('../config/cloudinary');

// Runs multer and turns its errors (too big, not an image) into a clean 400
const handleUpload = (req, res, next) =>
  upload.single('image')(req, res, (err) =>
    err ? res.status(400).json({ message: err.message }) : next()
  );

// Multipart forms send everything as text, so convert the fields.
// Only these fields can be set from the request (nothing else gets through).
const readFields = (body) => {
  const out = {};
  if (body.name !== undefined) out.name = String(body.name).trim();
  if (body.description !== undefined) out.description = String(body.description).trim();
  if (body.category !== undefined) out.category = String(body.category).trim();
  if (body.isAvailable !== undefined) out.isAvailable = body.isAvailable === true || body.isAvailable === 'true';
  if (body.variants !== undefined) {
    out.variants = typeof body.variants === 'string' ? JSON.parse(body.variants) : body.variants;
  }
  return out;
};

// ---------- PUBLIC: guests can browse ----------
router.get('/', async (req, res) => {
  try {
    const menuItems = await Menuitems.find({ isAvailable: { $ne: false } });
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- ADMIN: see everything, including hidden items ----------
// (must stay above '/:id' so "all" is not treated as an id)
router.get('/all', protect, authorize('admin'), async (req, res) => {
  try {
    const menuItems = await Menuitems.find().sort({ category: 1, name: 1 });
    res.json(menuItems);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const menuItem = await Menuitems.findById(req.params.id);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
    res.json(menuItem);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ---------- ADMIN ONLY: create / update / delete ----------
router.post('/', protect, authorize('admin'), handleUpload, async (req, res) => {
  let uploadedId = null;
  try {
    const menuItem = new Menuitems(readFields(req.body));
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer);
      uploadedId = result.public_id;
      menuItem.image = result.secure_url;
      menuItem.imagePublicId = result.public_id;
    }
    const saved = await menuItem.save();
    res.status(201).json(saved);
  } catch (err) {
    if (uploadedId) cloudinary.uploader.destroy(uploadedId).catch(() => {}); // don't leave an orphan photo
    res.status(400).json({ message: err.message });
  }
});

router.put('/:id', protect, authorize('admin'), handleUpload, async (req, res) => {
  let uploadedId = null;
  try {
    const menuItem = await Menuitems.findById(req.params.id);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });

    Object.assign(menuItem, readFields(req.body));

    let oldPublicId = null;
    if (req.file) {
      const result = await uploadBuffer(req.file.buffer);
      uploadedId = result.public_id;
      oldPublicId = menuItem.imagePublicId;
      menuItem.image = result.secure_url;
      menuItem.imagePublicId = result.public_id;
    }

    const updated = await menuItem.save();
    if (oldPublicId) cloudinary.uploader.destroy(oldPublicId).catch(() => {}); // remove the replaced photo
    res.json(updated);
  } catch (err) {
    if (uploadedId) cloudinary.uploader.destroy(uploadedId).catch(() => {});
    res.status(400).json({ message: err.message });
  }
});

router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const menuItem = await Menuitems.findById(req.params.id);
    if (!menuItem) return res.status(404).json({ message: 'Menu item not found' });
    const publicId = menuItem.imagePublicId;
    await menuItem.deleteOne();
    if (publicId) cloudinary.uploader.destroy(publicId).catch(() => {});
    res.json({ message: 'Menu item deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;