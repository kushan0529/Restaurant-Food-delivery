const express = require("express");
const router = express.Router();
const Order = require('../Models/Order');

// POST /api/orders - place order
router.post("/", async (req, res) => {
  try {
    const { customerName, customerPhone, items } = req.body;
    if (!items || items.length === 0) {
      return res.status(400).json({ message: "Order must have at least one item" });
    }
    const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const order = await Order.create({ customerName, customerPhone, items, totalAmount });
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ message: "Failed to place order", error: err.message });
  }
});

// GET /api/orders - admin views orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch orders", error: err.message });
  }
});

// PUT /api/orders/:id - update status
router.put("/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const updated = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!updated) return res.status(404).json({ message: "Order not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: "Failed to update order", error: err.message });
  }
});

module.exports = router;