const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendPromotionNotification } = require('../utils/mailer');

router.get('/', async (req, res) => {
  try {
    await db.query(`
      UPDATE promotions 
      SET is_active = 0 
      WHERE end_date < NOW() AND is_active = 1
    `);

  
    const query = `SELECT * FROM promotions ORDER BY created_at DESC`;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/active', async (req, res) => {
  try {
    
    const query = `
      SELECT * FROM promotions 
      WHERE is_active = 1 AND NOW() BETWEEN start_date AND end_date 
      ORDER BY created_at DESC
    `;
    const [rows] = await db.query(query);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `SELECT 
        pr.*, 
        pp.promo_price, 
        pp.discount_percentage,
        pp.promotion_id,
        pp.product_id,
        c.name as cname
      FROM products AS pr
      INNER JOIN promotion_products AS pp ON pr.id = pp.product_id
      INNER JOIN categories AS c ON pr.category_id = c.id
      WHERE pp.promotion_id = ?
    `;
    const [rows] = await db.query(query, [id]);
    res.status(200).json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  const { title, start_date, end_date, is_active } = req.body;

  if (!title || !start_date || !end_date) {
    return res.status(400).json({ error: 'يرجى إدخال جميع البيانات المطلوبة (العنوان، تاريخ البداية، وتاريخ النهاية)' });
  }

  try {
    const activeState = is_active !== undefined ? is_active : 1;
    const [result] = await db.query(
      "INSERT INTO promotions (title, start_date, end_date, is_active) VALUES (?, ?, ?, ?)",
      [title, start_date, end_date, activeState]
    );

    // 🔹 1. جلب إيميلات المستخدمين المشتركين بالـ Newsletter
    const [subscribers] = await db.query(
      "SELECT email FROM users WHERE (subscribe_to_newsletter = TRUE OR subscribe_to_newsletter = 1) AND email IS NOT NULL AND email != ''"
    );

    const emailList = subscribers.map((u) => u.email);

    // 🔹 2. استدعاء دالة الإرسال التلقائي
    if (emailList.length > 0) {
      await sendPromotionNotification(emailList, title);
    }

    res.status(201).json({ message: 'تمت إضافة العرض بنجاح وإشعار المشتركين', id: result.insertId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.patch('/:id/toggle-active', async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  try {
    await db.query("UPDATE promotions SET is_active = ? WHERE id = ?", [is_active, id]);
    res.json({ message: 'تم تحديث حالة العرض بنجاح', is_active });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/products', async (req, res) => {
  try {
    const { id } = req.params; 
    const { product_id, discount_percentage } = req.body;

   //product
    const [[product]] = await db.query('SELECT price FROM products WHERE id = ?', [product_id]);

    if (!product) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    const originalPrice = product.price;
    const promoPrice = originalPrice - (originalPrice * (discount_percentage / 100));

  
    const query = `
      INSERT INTO promotion_products (promotion_id, product_id, promo_price, discount_percentage)
      VALUES (?, ?, ?, ?)
    `;

   
    await db.query(query, [id, product_id, promoPrice, discount_percentage]);

    res.status(201).json({ 
      message: 'تمت إضافة المنتج للعرض بنجاح',
      promo_price: promoPrice 
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query("DELETE FROM promotions WHERE id = ?", [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'العرض غير موجود' });
    }

    res.json({ message: 'تم حذف العرض بنجاح' });
  } catch (err) {
    console.error('Error deleting promotion:', err);
    res.status(500).json({ error: err.message });
  }
});


router.delete('/:id/products/:productId', async (req, res) => {
  try {
    const { id, productId } = req.params;

    const query = `
      DELETE FROM promotion_products 
      WHERE promotion_id = ? AND product_id = ?
    `;

    const [result] = await db.query(query, [id, productId]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'المنتج غير موجود بهذا العرض أساساً' });
    }

    res.status(200).json({ message: 'تمت إزالة المنتج من العرض بنجاح' });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;