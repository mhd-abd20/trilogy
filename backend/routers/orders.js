const express = require('express');
const router = express.Router();
const db = require('../db');


router.post('/checkout', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { items, totalAmount, userId } = req.body;

    
    const [orderResult] = await connection.query(
      `INSERT INTO orders (user_id, total_amount, created_at) VALUES (?, ?, NOW())`,
      [userId || null, totalAmount]
    );
    const orderId = orderResult.insertId;

    
    for (const item of items) {
      const [productRows] = await connection.query(
        `SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE`,
        [item.productId]
      );

      if (productRows.length === 0) {
        throw new Error(`المنتج رقم ${item.productId} غير موجود`);
      }

      if (productRows[0].stock_quantity < item.quantity) {
        throw new Error(`الكمية المطلوبة غير متوفرة للمنتج رقم ${item.productId}`);
      }

     
      await connection.query(
        `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
        [item.quantity, item.productId]
      );

     
      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    await connection.commit();
    res.status(201).json({ success: true, message: 'تم حفظ الطلب وتحديث المخزون بنجاح!', orderId });

  } catch (err) {
    await connection.rollback();
    console.error('Checkout Error:', err);
    res.status(400).json({ success: false, message: err.message || 'حدث خطأ أثناء معالجة الطلب' });
  } finally {
    connection.release();
  }
});


router.post('/checkout-guest', async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { name, phone, email, address, items, totalAmount, guestId } = req.body;

    let finalGuestId = guestId;

    if (!finalGuestId) {
      if (!name || !phone) {
        throw new Error('الاسم ورقم الهاتف مطلوبان لإتمام الطلب');
      }

      const [guestResult] = await connection.query(
        `INSERT INTO guests (name, phone, email, address, created_at) VALUES (?, ?, ?, ?, NOW())`,
        [name, phone, email || null, address || null]
      );

      finalGuestId = guestResult.insertId;
    }

    const [orderResult] = await connection.query(
      `INSERT INTO orders (guest_id, total_amount, created_at) VALUES (?, ?, NOW())`,
      [finalGuestId, totalAmount]
    );
    const orderId = orderResult.insertId;

    for (const item of items) {
      const [productRows] = await connection.query(
        `SELECT stock_quantity FROM products WHERE id = ? FOR UPDATE`,
        [item.productId]
      );

      if (productRows.length === 0) {
        throw new Error(`المنتج رقم ${item.productId} غير موجود`);
      }

      if (productRows[0].stock_quantity < item.quantity) {
        throw new Error(`الكمية المطلوبة غير متوفرة للمنتج رقم ${item.productId}`);
      }

      await connection.query(
        `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
        [item.quantity, item.productId]
      );

      await connection.query(
        `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
        [orderId, item.productId, item.quantity, item.unitPrice]
      );
    }

    await connection.commit();

    res.status(201).json({ 
      success: true, 
      message: 'تم حفظ الطلب وتحديث المخزون بنجاح!', 
      orderId,
      guestId: finalGuestId 
    });

  } catch (err) {
    await connection.rollback();
    console.error('Checkout Error:', err);
    res.status(400).json({ success: false, message: err.message || 'حدث خطأ أثناء معالجة الطلب' });
  } finally {
    connection.release();
  }
});


router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'ID المستخدم مطلوب' });
    }

  
    const [orders] = await db.query(
      `SELECT id AS order_id, total_amount, created_at, status 
       FROM orders 
       WHERE user_id = ? 
       ORDER BY created_at DESC`,
      [userId]
    );

    if (orders.length === 0) {
      return res.json([]);
    }

    const orderIds = orders.map(o => o.order_id);
    const [items] = await db.query(
      `SELECT 
         oi.order_id,
         oi.id AS item_id,
         oi.quantity,
         oi.unit_price,
         p.id AS product_id,
         p.name AS product_name,
         p.image_url
       FROM order_items oi
       JOIN products p ON oi.product_id = p.id
       WHERE oi.order_id IN (?)`,
      [orderIds]
    );


    const formattedOrders = orders.map(order => {
      return {
        ...order,
        items: items.filter(item => item.order_id === order.order_id)
      };
    });

    res.json(formattedOrders);

  } catch (err) {
    console.error('Error fetching user order history:', err);
    res.status(500).json({ error: err.message || 'حدث خطأ داخلي في السيرفر' });
  }
});
module.exports = router;