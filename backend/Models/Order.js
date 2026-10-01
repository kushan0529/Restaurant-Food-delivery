const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "Menuitems", required: true },
    name: { type: String, required: true },
    variant: { type: String, required: true }, // NEW: "Full", "Half", "Regular"...
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, 
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    deliveryAddress: { type: String, required: true }, 
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["received", "preparing", "ready", "out for delivery", "completed", "cancelled"],
      default: "received",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);