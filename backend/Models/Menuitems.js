const mongoose=require('mongoose');

const MenuitemsSchema=new mongoose.Schema({
    name:{type:String,required:true},
    description:{type:String,required:true},
    price:{type:Number,required:true},
    category:{type:String,required:true},
    image:{type:String,required:true},
},
{timestamps:true})

const Menuitems=mongoose.model('Menuitems',MenuitemsSchema);
module.exports=Menuitems;