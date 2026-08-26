const express = require('express');
const router = express.Router();
const db = require('../db');


router.get('/', async (req, res) => {
  try {
    const [users] = await db.query(
      'SELECT id, name, email, phone, address, role, created_at FROM users ORDER BY id DESC'
    );
    res.json(users);
  } catch (error) {
    console.error('Fetch users error:', error);
    res.status(500).json({ message: 'فشل في جلب قائمة المستخدمين' });
  }
});

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

// 2. تحديث بيانات ودور المستخدم
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, role } = req.body;

  if (!name || !email || !role) {
    return res.status(400).json({ message: 'يرجى تعبئة الحقول الأساسية' });
  }

  try {
    const updateSql = `
      UPDATE users 
      SET name = ?, email = ?, phone = ?, address = ?, role = ? 
      WHERE id = ?
    `;
    await db.query(updateSql, [name, email, phone || null, address || null, role, id]);

    res.json({ message: 'تم تحديث بيانات المستخدم بنجاح' });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ message: 'فشل في تحديث بيانات المستخدم' });
  }
});

// 3. حذف مستخدم (اختياري)
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ message: 'تم حذف المستخدم بنجاح' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'فشل حذف المستخدم' });
  }
});

module.exports = router;