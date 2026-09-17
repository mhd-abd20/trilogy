const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        C.id, 
        C.name, 
        C.is_active, 
        COALESCE(SUM(p.stock_quantity), 0) AS total_stock
      FROM categories AS C
      LEFT JOIN products AS p ON C.id = p.category_id
      GROUP BY C.id
    `;
    
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { name, is_active } = req.body;


  const cleanName = typeof name === 'string' ? name.trim() : '';

  if (!cleanName) {
    return res.status(400).json({ error: 'اسم الفئة مطلوب ولا يمكن أن يكون مسافات فارغة فقط' });
  }

  try {
    
    const [existingCategory] = await db.query(
      'SELECT id FROM categories WHERE LOWER(TRIM(name)) = LOWER(?)',
      [cleanName]
    );

    if (existingCategory.length > 0) {
      return res.status(409).json({ error: 'هذه الفئة موجودة بالفعل' }); 
    }

    const activeState = is_active !== undefined ? is_active : true;

    const [result] = await db.query(
      'INSERT INTO categories (name, is_active) VALUES (?, ?)',
      [cleanName, activeState]
    );

    res.status(201).json({
      message: 'تم إضافة الفئة بنجاح',
      categoryId: result.insertId
    });
  } catch (err) {
 
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'هذه الفئة مسجلة مسبقاً' });
    }
    res.status(500).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, is_active } = req.body;

  try {
    const [result] = await db.query(
      'UPDATE categories SET name = ?, is_active = ? WHERE id = ?',
      [name, is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'الفئة غير موجودة' });
    }

    res.json({ message: 'تم تحديث الفئة بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;