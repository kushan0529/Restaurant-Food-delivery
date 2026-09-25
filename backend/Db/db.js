const mongoose=require('mongoose');

const connectDB=async()=>{
    try{
        const connect=await mongoose.connect(process.env.MONGO_URI)
        console.log("successfully connected ")
    }
    catch(err){
        console.log(err)
    }
}
module.exports=connectDB