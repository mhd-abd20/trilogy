const express = require('express');
const router = express.Router();
const db = require('../db')



router.get('/:id',async(req,res)=>{
    const { id } = req.params;
    try{
      query=`SELECT * FROM users WHERE id=?`
        const [rows] = await db.query(query,[id]);
        res.json(rows[0]);
    }
    catch(err){
        res.status(500).json({ error: err.message });
    }
})


module.exports = router;