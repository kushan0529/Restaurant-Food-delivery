const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema(
  {
    label: { type: String, required: true }, // "Full", "Half", "Regular"...
    price: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const MenuitemsSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: '' },
    category: { type: String, required: true },
    image: { type: String, default: '' },
    imagePublicId: { type: String, default: '' }, // lets us delete the old photo when it is replaced
    isAvailable: { type: Boolean, default: true },
    // Full/Half or single-size options. Each has its own price.
    variants: {
      type: [variantSchema],
      validate: (v) => v.length > 0,
    },
  },
  { timestamps: true }
);

const Menuitems = mongoose.model('Menuitems', MenuitemsSchema);
module.exports = Menuitems;