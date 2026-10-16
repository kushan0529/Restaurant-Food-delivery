const express=require('express');
const router=express.Router();
const {protect,authorize}=require('../Middlewares/authMiddlewares')

const {register,login,savePushToken,removePushToken}=require('../Controllers/authController')

router.post('/register',register);
router.post('/login',login);
router.post('/push-token',protect,savePushToken);
router.delete('/push-token',protect,removePushToken)

module.exports=router;
