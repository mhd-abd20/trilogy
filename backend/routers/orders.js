const express = require('express');
const router = express.Router();
const db = require('../db');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL);

redis.on('connect', () => {
  console.log('Connected to Redis successfully');
});

redis.on('error', (err) => {
  console.error('Redis Connection Error:', err);
});


router.post('/checkout', async (req, res) => {
  const { items, totalAmount, userId } = req.body;

  // مصفوفة لتتبع العناصر التي تم خصمها من Redis لإرجاعها في حال فشل عملية MySQL
  const decrementedItems = [];

  try {
    // -------------------------------------------------------------
    // الخطوة 1: فحص وخصم الكميات في Redis (In-Memory / Fast Checking)
    // -------------------------------------------------------------
    for (const item of items) {
      const stockKey = `product:stock:${item.productId}`;

      // التأكد من وجود المفتاح في Redis، وإذا لم يكن موجوداً نجلبه من MySQL
      const exists = await redis.exists(stockKey);
      if (!exists) {
        const [rows] = await db.query(
          'SELECT stock_quantity FROM products WHERE id = ?',
          [item.productId]
        );

        if (rows.length === 0) {
          throw new Error(`المنتج رقم ${item.productId} غير موجود`);
        }

        // حفظ المخزون الحالي في Redis
        await redis.set(stockKey, rows[0].stock_quantity);
      }

      // خصم الكمية بشكل ذرّي (Atomic) في أجزاء من الملي ثانية
      const remainingStock = await redis.decrby(stockKey, item.quantity);
      decrementedItems.push({ productId: item.productId, quantity: item.quantity });

      // إذا أصبحت الكمية أقل من 0، فهذا يعني أن المخزون نفذ
      if (remainingStock < 0) {
        throw new Error(`الكمية المطلوبة غير متوفرة للمنتج رقم ${item.productId}`);
      }
    }

    // -------------------------------------------------------------
    // الخطوة 2: تنفيذ الحفظ والتحديث في MySQL (بدون FOR UPDATE أو قفل ببطء)
    // -------------------------------------------------------------
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      // إنشاء الطلب الرئيسي
      const [orderResult] = await connection.query(
        `INSERT INTO orders (user_id, total_amount, created_at) VALUES (?, ?, NOW())`,
        [userId || null, totalAmount]
      );
      const orderId = orderResult.insertId;

      for (const item of items) {
        // تحديث المخزون مباشرة في جدول المنتجات
        await connection.query(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
          [item.quantity, item.productId]
        );

        // إدراج تفاصيل المنتجات المشتراة
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
          [orderId, item.productId, item.quantity, item.unitPrice]
        );
      }

      await connection.commit();
      
      return res.status(201).json({
        success: true,
        message: 'تم حفظ الطلب وتحديث المخزون بنجاح!',
        orderId
      });

    } catch (dbErr) {
      // إرجاع التغييرات في MySQL عند حدوث خطأ داتا بيز
      await connection.rollback();
      throw dbErr; // إلقاء الخطأ ليتكفل به الـ catch الخارجي ليقوم بـ Rollback لـ Redis
    } finally {
      connection.release();
    }

  } catch (err) {
    // -------------------------------------------------------------
    // الخطوة 3: إرجاع الكميات المخصومة من Redis عند حدوث أي استثناء (Rollback)
    // -------------------------------------------------------------
    for (const item of decrementedItems) {
      const stockKey = `product:stock:${item.productId}`;
      await redis.incrby(stockKey, item.quantity);
    }

    console.error('Checkout Error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'حدث خطأ أثناء معالجة الطلب'
    });
  }
});

router.post('/checkout-guest', async (req, res) => {
  const { name, phone, email, address, items, totalAmount, guestId } = req.body;

  // مصفوفة لتتبع العناصر التي تم خصمها من Redis لإرجاعها عند حدوث أي خطأ
  const decrementedItems = [];

  try {
    // -------------------------------------------------------------
    // الخطوة 1: فحص وخصم الكميات في Redis (In-Memory / Fast Checking)
    // -------------------------------------------------------------
    for (const item of items) {
      const stockKey = `product:stock:${item.productId}`;

      // التأكد من وجود المفتاح في Redis، وإذا لم يكن موجوداً نجلبه من MySQL
      const exists = await redis.exists(stockKey);
      if (!exists) {
        const [rows] = await db.query(
          'SELECT stock_quantity FROM products WHERE id = ?',
          [item.productId]
        );

        if (rows.length === 0) {
          throw new Error(`المنتج رقم ${item.productId} غير موجود`);
        }

        // حفظ المخزون الحالي في Redis
        await redis.set(stockKey, rows[0].stock_quantity);
      }

      // خصم الكمية بشكل ذرّي (Atomic) في Redis
      const remainingStock = await redis.decrby(stockKey, item.quantity);
      decrementedItems.push({ productId: item.productId, quantity: item.quantity });

      // إذا أصبحت الكمية أقل من 0، فهذا يعني أن المخزون نفذ
      if (remainingStock < 0) {
        throw new Error(`الكمية المطلوبة غير متوفرة للمنتج رقم ${item.productId}`);
      }
    }

    // -------------------------------------------------------------
    // الخطوة 2: تنفيذ الحفظ في MySQL (الزائر، الطلب، والمخزون)
    // -------------------------------------------------------------
    const connection = await db.getConnection();

    try {
      await connection.beginTransaction();

      let finalGuestId = guestId;

      // إنشاء زائر جديد إذا لم يكن موجوداً مسبقاً
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

      // إنشاء الطلب الخاص بالزائر
      const [orderResult] = await connection.query(
        `INSERT INTO orders (guest_id, total_amount, created_at) VALUES (?, ?, NOW())`,
        [finalGuestId, totalAmount]
      );
      const orderId = orderResult.insertId;

      for (const item of items) {
        // تحديث المخزون مباشرة في جدول المنتجات (بدون FOR UPDATE)
        await connection.query(
          `UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?`,
          [item.quantity, item.productId]
        );

        // إدراج عناصر الطلب
        await connection.query(
          `INSERT INTO order_items (order_id, product_id, quantity, unit_price) VALUES (?, ?, ?, ?)`,
          [orderId, item.productId, item.quantity, item.unitPrice]
        );
      }

      await connection.commit();

      return res.status(201).json({
        success: true,
        message: 'تم حفظ الطلب وتحديث المخزون بنجاح!',
        orderId,
        guestId: finalGuestId
      });

    } catch (dbErr) {
      await connection.rollback();
      throw dbErr; // إلقاء الخطأ ليتكفل به الـ catch الخارجي ليقوم بـ Rollback لـ Redis
    } finally {
      connection.release();
    }

  } catch (err) {
    // -------------------------------------------------------------
    // الخطوة 3: إرجاع الكميات المخصومة من Redis عند حدوث أي خطأ (Rollback)
    // -------------------------------------------------------------
    for (const item of decrementedItems) {
      const stockKey = `product:stock:${item.productId}`;
      await redis.incrby(stockKey, item.quantity);
    }

    console.error('Checkout Error:', err);
    return res.status(400).json({
      success: false,
      message: err.message || 'حدث خطأ أثناء معالجة الطلب'
    });
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

router.get('/all-orders', async (req, res) => {
  try {
    const query = `
      SELECT 
        orders.id AS order_id,
        orders.total_amount,
        orders.status,
        orders.created_at,
        CASE 
          WHEN orders.user_id IS NOT NULL THEN 'Client'
          ELSE 'Guest'
        END AS user_type,
        COALESCE(users.name, guests.name) AS customer_name,
        COALESCE(users.email, guests.email) AS customer_email,
        COALESCE(users.phone, guests.phone, 'غير متوفر') AS customer_phone
      FROM orders
      LEFT JOIN users ON orders.user_id = users.id
      LEFT JOIN guests ON orders.guest_id = guests.id
      ORDER BY orders.created_at DESC
    `;

    const [orders] = await db.query(query);
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ message: 'فشل في جلب عمليات الشراء' });
  }
});


router.put("/accept/:id" , async(req,res)=>{
  try{
    const {id} = req.params;
    const query = "UPDATE orders SET status ='accepted' WHERE id =?"
    const [result] = await db.query(query,[id])

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    res.status(200).json("order accepted")
  }
  catch(err){
    res.status(500).json({error: err.message})
  }
})


router.put('/decline/:id', async (req, res) => {
  const { id } = req.params;
  const connection = await db.getConnection(); 

  try {
    await connection.beginTransaction();

   
    const [orderRows] = await connection.query(
      'SELECT status FROM orders WHERE id = ? FOR UPDATE',
      [id]
    );

    if (orderRows.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: 'الطلب غير موجود' });
    }

    if (orderRows[0].status === 'declined') {
      await connection.rollback();
      return res.status(400).json({ message: 'الطلب مرفوض مسبقاً' });
    }

  
    const [items] = await connection.query(
      'SELECT product_id, quantity FROM order_items WHERE order_id = ?',
      [id]
    );

   
    for (const item of items) {
      await connection.query(
        'UPDATE products SET stock_quantity = stock_quantity + ? WHERE id = ?',
        [item.quantity, item.product_id]
      );
    }

  
    await connection.query(
      "UPDATE orders SET status = 'declined' WHERE id = ?",
      [id]
    );

    await connection.commit();
    res.status(200).json({ message: 'تم رفض الطلب وإعادة المنتجات إلى المخزون بنجاح' });

  } catch (err) {
    await connection.rollback(); 
    console.error('Error declining order:', err);
    res.status(500).json({ error: 'حدث خطأ أثناء رفض الطلب', details: err.message });
  } finally {
    connection.release(); 
  }
});
module.exports = router;