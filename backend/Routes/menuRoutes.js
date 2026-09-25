const express=require('express');
const router=express.Router();
const Menuitems=require('../Models/Menuitems');

// Get all menu items
router.get('/',async(req,res)=>{
    try{
        const menuItems=await Menuitems.find();
        res.json(menuItems);
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
});

// Get a single menu item by ID
router.get('/:id',async(req,res)=>{
    try{
        const menuItem=await Menuitems.findById(req.params.id);
        if(!menuItem){
            return res.status(404).json({message:'Menu item not found'});
        }
        res.json(menuItem);
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
});


router.post('/',async(req,res)=>{
    const menuItem=new Menuitems({
        name:req.body.name,
        description:req.body.description,
        price:req.body.price,
        category:req.body.category,
        image:req.body.image
    });
    try{
        const newMenuItem=await menuItem.save();
        res.status(201).json(newMenuItem);
    }
    catch(err){
        res.status(400).json({message:err.message});
    }
});

router.put('/:id',async(req,res)=>{
    try{
        const menuItem=await Menuitems.findById(req.params.id);
        if(!menuItem){
            return res.status(404).json({message:'Menu item not found'});
        }
        menuItem.name=req.body.name;
        menuItem.description=req.body.description;
        menuItem.price=req.body.price;
        menuItem.category=req.body.category;
        menuItem.image=req.body.image;

        const updatedMenuItem=await menuItem.save();
        res.json(updatedMenuItem);
    }
    catch(err){
        res.status(400).json({message:err.message});
    }
});

router.delete('/:id',async(req,res)=>{
    try{
        const menuItem=await Menuitems.findById(req.params.id);
        if(!menuItem){
            return res.status(404).json({message:'Menu item not found'});
        }
        await menuItem.remove();
        res.json({message:'Menu item deleted'});
    }
    catch(err){
        res.status(500).json({message:err.message});
    }
});

module.exports=router;