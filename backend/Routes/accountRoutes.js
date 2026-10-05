const express = require('express');
const router = express.Router();
const User = require('../Models/user');
const Order = require('../Models/Order');
const { protect } = require('../Middlewares/authMiddlewares');

// DELETE /api/account : a logged-in user deletes their own account
router.delete('/', protect, async (req, res) => {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({ message: 'Admin accounts cannot be deleted from the app' });
    }
    // keep the restaurant's order records, but remove the customer's personal details from them
    await Order.updateMany(
      { user: req.user.id },
      { $set: { customerName: 'Deleted user', customerPhone: 'deleted', deliveryAddress: 'deleted' } }
    );
    await User.findByIdAndDelete(req.user.id);
    res.json({ message: 'Account deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;