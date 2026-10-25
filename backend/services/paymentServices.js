// razor pay for the payment gateway
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Order = require("../Models/orderModel");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create a new order
const createOrder = async (req, res) => {
  try {
    const { amount, currency } = req.body;

    const options = {
      amount: amount * 100, // Amount in paise
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    // Save the order details in the database
    const newOrder = new Order({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      status: order.status,
    });

    await newOrder.save();

    res.status(201).json({ success: true, order });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to create order" });
  }
};

// Verify payment
const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const generatedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature === razorpay_signature) {
      // Update the order status in the database
      await Order.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: "paid", paymentId: razorpay_payment_id }
      );

      res.status(200).json({ success: true, message: "Payment verified successfully" });
    } else {
      res.status(400).json({ success: false, message: "Invalid signature" });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Failed to verify payment" });
  }
};

module.exports = { createOrder, verifyPayment };    