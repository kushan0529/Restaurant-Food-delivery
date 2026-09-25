const mongoose=require('mongoose');

const MenuitemsSchema=new mongoose.Schema({
    name:{type:String,required:true},
    price:{type:Number,required:true},
    
})