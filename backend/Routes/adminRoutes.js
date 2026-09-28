const express = require('express');
const router = express.Router();
const {protect,authorize}=require('../Middlewares/authMiddlewares')
const { getAllUsers, deleteUser } = require('../Controllers/userController');

router.get('/dashboard',protect,(req,res)=>res.json({message:`Welcome ${req.user.role} ${req.user.id} to the dashboard`}));
router.get('/users', protect, authorize('admin'), getAllUsers);
router.delete('/users/:id', protect, authorize('admin'), deleteUser);

module.exports = router;