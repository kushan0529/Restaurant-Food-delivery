const express=require('express');
const router=express.Router();
const {protect,authorize}=require('../Middlewares/authMiddlewares')

const {register,login,savePushToken}=require('../Controllers/authController')

router.post('/register',register);
router.post('/login',login);
routerpost('push-token',protect,savePushToken)

module.exports=router;
