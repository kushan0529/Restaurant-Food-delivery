const mongoose=require('mongoose');

const MenuitemsSchema=new mongoose.Schema({
    name:{type:String,required:true},
    description:{type:String,default:''},
    category:{type:String,required:true},
    variants:[{
        label:{type:String,required:true},
        price:{type:Number,required:true},
    }],
    isAvailable:{type:Boolean,default:true},
    image:{type:String,default:''},
},
{timestamps:true})

const Menuitems=mongoose.model('Menuitems',MenuitemsSchema);
module.exports=Menuitems;
