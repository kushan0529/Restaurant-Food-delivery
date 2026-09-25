// const mongoose=require('mongoose')

// const OrderSchema=new mongoose.Schema({
//     userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
//     items:[{
//         menuItemId:{type:mongoose.Schema.Types.ObjectId,ref:"Menuitems",required:true},
//         quantity:{type:Number,required:true}
//     }],
//     totalPrice:{type:Number,required:true},
//     status:{type:String,enum:["pending","preparing","delivering","delivered"],default:"pending"},
//     createdAt:{type:Date,default:Date.now}
// })

// const Order=mongoose.model("Order",OrderSchema)
// module.exports=Order    

const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema(
  {
    menuItem: { type: mongoose.Schema.Types.ObjectId, ref: "MenuItem", required: true },
    name: { type: String, required: true },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    customerName: { type: String, required: true },
    customerPhone: { type: String, required: true },
    items: { type: [orderItemSchema], required: true },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ["received", "preparing", "ready", "completed", "cancelled"],
      default: "received",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Order", orderSchema);