const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const { protect } = require("../Middlewares/authMiddlewares");
const Menuitems = require("../Models/Menuitems");
const Payment = require("../Models/Payment");

const router = express.Router();
const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID, key_secret: process.env.RAZORPAY_KEY_SECRET });
const captchaSecret = process.env.CAPTCHA_SECRET || process.env.JWT_SECRET;

function signCaptcha(text, expires) {
  return crypto.createHmac("sha256", captchaSecret).update(`${text}.${expires}`).digest("hex");
}

function calculateItems(items, menuDocs) {
  const byId = new Map(menuDocs.map((doc) => [doc._id.toString(), doc]));
  return items.map((item) => {
    const doc = byId.get(String(item.menuItemId));
    const quantity = Number(item.quantity);
    const variant = doc?.variants.find((v) => v.label === item.variant);
    if (!doc || !variant || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return null;
    return { price: variant.price, quantity };
  });
}

router.get("/captcha", protect, (req, res) => {
  const text = crypto.randomBytes(3).toString("hex").toUpperCase();
  const expires = Date.now() + 10 * 60 * 1000;
  res.json({ text, token: `${text}.${expires}.${signCaptcha(text, expires)}` });
});

router.post("/create-order", protect, async (req, res) => {
  try {
    const { items } = req.body;
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ message: "Cart is empty" });
    const menuDocs = await Menuitems.find({ _id: { $in: items.map((item) => item.menuItemId) }, isAvailable: true });
    const pricedItems = calculateItems(items, menuDocs);
    if (pricedItems.some((item) => !item)) return res.status(400).json({ message: "Invalid or unavailable item in cart" });
    const amount = pricedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const gatewayOrder = await razorpay.orders.create({ amount: amount * 100, currency: "INR", receipt: `receipt_${Date.now()}` });
    await Payment.create({ user: req.user.id, razorpayOrderId: gatewayOrder.id, amount, currency: "INR" });
    res.status(201).json({ key: process.env.RAZORPAY_KEY_ID, order: gatewayOrder });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create payment order" });
  }
});

router.post("/verify", protect, async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) return res.status(400).json({ message: "Incomplete payment details" });
    const payment = await Payment.findOne({ razorpayOrderId: razorpay_order_id, user: req.user.id });
    const expected = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET).update(`${razorpay_order_id}|${razorpay_payment_id}`).digest("hex");
    const signaturesMatch = razorpay_signature.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));
    if (!payment || !signaturesMatch) return res.status(400).json({ message: "Payment verification failed" });
    payment.verified = true;
    payment.paymentId = razorpay_payment_id;
    await payment.save();
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to verify payment" });
  }
});

module.exports = { router, signCaptcha };
