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

  if (!name) {
    return res.status(400).json({ error: 'اسم الفئة مطلوب' });
  }

  try {
 const [result] = await db.query(
  'INSERT INTO categories (name, is_active) VALUES (?, ?)',
  [name, true]
);

    res.status(201).json({
      message: 'تم إضافة الفئة بنجاح',
      categoryId: result.insertId
    });
  } catch (err) {
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