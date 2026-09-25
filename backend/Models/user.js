const mongoose=require("mongoose");
const userSchema =new mongoose.Schema({
    name:{type:String,required:true},
    password:{type:String,required:true},
    mobilennumber:{type:Number,required:true},
    role:{enum:["user","admin"],default:"user"},
    adress:{type:String,required:true},
})

const User=mongoose.model("User",userSchema);
module.exports=User;    
