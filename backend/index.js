require("dotenv").config();
const express=require('express');
const cors=require('cors');
const connectDB=require('./Db/db');
const menuRoutes=require('./Routes/menuRoutes');
const orderRoutes=require('./Routes/orderRoutes');
const adminRoutes=require('./Routes/adminRoutes')


const app=express();
app.use(cors({origin:"*"}));
app.use(express.json());
connectDB();

app.use('/api/menu',menuRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/admin',adminRoutes);

app.get('/',(req,res)=>{
    res.send('Restaurant app backend is running');
});

const PORT=process.env.PORT || 5001;
app.listen(PORT,'0.0.0.0',()=>{
    console.log(`Server is running on port ${PORT}`);
})
