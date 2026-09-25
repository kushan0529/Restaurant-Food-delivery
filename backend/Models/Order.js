const mongoose=require('mongoose')

const OrderSchema=new mongoose.Schema({
    userId:{type:mongoose.Schema.Types.ObjectId,ref:"User",required:true},
    items:[{
        menuItemId:{type:mongoose.Schema.Types.ObjectId,ref:"Menuitems",required:true},
        quantity:{type:Number,required:true}
    }],
    totalPrice:{type:Number,required:true},
    status:{enum:["pending","preparing","delivering","delivered"],default:"pending"},
    createdAt:{type:Date,default:Date.now}
})

const Order=mongoose.model("Order",OrderSchema)
module.exports=Order    