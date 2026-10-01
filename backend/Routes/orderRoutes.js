const express = require('express');
const router = express.Router();
const Order = require('../Models/Order')
const Menuitems = require('../Models/Menuitems');
const { protect, authorize } = require('../Middlewares/authMiddlewares');

const STATUSES = ['received', 'preparing', 'ready', 'out for delivery', 'completed', 'cancelled'];

// POST /api/orders - place order (login required)
// body: { customerName, customerPhone, deliveryAddress, items: [{ menuItemId, variant, quantity }] }
router.post('/', protect, async (req, res) => {
  try {
    const { customerName, customerPhone, deliveryAddress, items } = req.body;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order must have at least one item' });
    }

    // Prices come from the database, never from the app
    const menuDocs = await Menuitems.find({
      _id: { $in: items.map((i) => i.menuItemId) },
      isAvailable: true,
    });
    const byId = new Map(menuDocs.map((d) => [d._id.toString(), d]));

    const orderItems = [];
    for (const i of items) {
      const doc = byId.get(String(i.menuItemId));
      const qty = Number(i.quantity);
      if (!doc || !Number.isInteger(qty) || qty < 1 || qty > 20) {
        return res.status(400).json({ message: 'Invalid or unavailable item in order' });
      }
      const variant = doc.variants.find((v) => v.label === i.variant);
      if (!variant) {
        return res.status(400).json({ message: `Invalid size for ${doc.name}` });
      }
      orderItems.push({
        menuItem: doc._id,
        name: doc.name,
        variant: variant.label,
        price: variant.price,
        quantity: qty,
      });
    }

    const totalAmount = orderItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
    const order = await Order.create({
      user: req.user.id,
      customerName,
      customerPhone,
      deliveryAddress,
      items: orderItems,
      totalAmount,
    });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: 'Failed to place order', error: err.message });
  }
});

// GET /api/orders/my - the logged-in user's own orders
router.get('/my', protect, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
});

// GET /api/orders - admin views all orders
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Failed to fetch orders', error: err.message });
  }
});

// PUT /api/orders/:id - admin updates status
router.put('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const { status } = req.body;
    if (!STATUSES.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${STATUSES.join(', ')}` });
    }
    const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: 'Order not found' });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: 'Failed to update order', error: err.message });
  }
});

module.exports = router;