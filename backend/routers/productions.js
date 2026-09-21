const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Redis = require('ioredis');
const axios = require('axios');

const redis = new Redis(process.env.REDIS_URL);

async function translateToEnglish(text) {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ar|en`
    );
    const data = await response.json();
    
    if (data && data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    }
    return text; 
  } catch (error) {
    console.error('Translation error:', error.message);
    return text; 
  }
}

const uploadDir = path.join(__dirname, '../images');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

router.get('/', async (req, res) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : null;
    const limit = req.query.limit ? parseInt(req.query.limit) : null;

    let paginationData = null;
    let limitClause = '';
    const queryParams = [];

    // إذا تم تمرير limit (مثل 100 في صفحة المنتجات أو 10 في الرئيسية)
    if (limit) {
      const currentPage = page || 1;
      const offset = (currentPage - 1) * limit;

      const [countResult] = await db.query('SELECT COUNT(*) as total FROM products');
      const total = countResult[0].total;

      paginationData = {
        total,
        totalPages: Math.ceil(total / limit),
        currentPage,
        limit
      };

      limitClause = 'LIMIT ? OFFSET ?';
      queryParams.push(limit, offset);
    }

    const query = `
      SELECT 
        p.id,
        p.category_id,
        p.name,
        p.description,
        p.price AS original_price,
        p.stock_quantity,
        p.image_url,
        p.youtube_url,
        active_promos.promo_price,
        active_promos.discount_percentage,
        active_promos.title AS promotion_title
      FROM products p
      LEFT JOIN (
        SELECT 
          pp.product_id, 
          pp.promo_price, 
          pp.discount_percentage, 
          pr.title
        FROM promotion_products pp
        INNER JOIN promotions pr ON pp.promotion_id = pr.id
        WHERE pr.is_active = 1 
          AND NOW() BETWEEN pr.start_date AND pr.end_date
      ) AS active_promos ON p.id = active_promos.product_id
      ORDER BY p.id DESC
      ${limitClause};
    `;

    const [rows] = await db.query(query, queryParams);

    // إذا طلب العميل pagination نرجع كائن يحتوي على المنتجات والبيانات الوصفية
    if (paginationData) {
      return res.json({
        products: rows,
        pagination: paginationData
      });
    }

    // إذا كان استدعاء قديماً بدون بارامترات نرجع مصفوفة المنتجات كالسابق
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        p.*, 
        c.name AS category_name 
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.id = ?
    `;
    const [rows] = await db.query(query, [id]);

    if (rows.length === 0) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', upload.single('image'), async (req, res) => {
  try {
    const { name, price, stock_quantity, category_id, description, image_url, youtube_url } = req.body;
    
    let finalImageUrl = null;
    if (req.file) {
      finalImageUrl = `/images/${req.file.filename}`;
    } else if (image_url) {
      finalImageUrl = image_url;
    }

    const query = `
      INSERT INTO products (name, price, stock_quantity, category_id, description, image_url, youtube_url)
      VALUES (?, ?, ?, ?, ?, ?,?)
    `;

    const [result] = await db.query(query, [
      name,
      price,
      stock_quantity || 0,
      category_id || null,
      description || '',
      finalImageUrl,
      youtube_url
    ]);

    res.status(201).json({
      message: 'تم إضافة المنتج بنجاح',
      productId: result.insertId,
      image_url: finalImageUrl
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// POST /api/products/bulk
router.post('/bulk', async (req, res) => {
  const { products } = req.body;

  if (!Array.isArray(products) || products.length === 0) {
    return res.status(400).json({ error: 'يجب إرسال مصفوفة منتجات تحتوي على عنصر واحد على الأقل.' });
  }

  // التحقق من اكتمال البيانات الأساسية لكل منتج
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (!p.name || p.original_price === undefined || p.original_price === '' || !p.category_id) {
      return res.status(400).json({
        error: `المنتج رقم ${i + 1} (${p.name || 'بدون اسم'}) تنقصه بيانات إلزامية (الاسم، السعر، أو الفئة).`
      });
    }
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // إعداد المصفوفة ثنائية الأبعاد لمطابقة ترتيب الأعمدة
    const values = products.map((p) => [
      p.name,
      Number(p.original_price),
      Number(p.stock_quantity) || 0,
      p.category_id,
      p.description || '',
      p.image_url || null,
      p.youtube_url || null
    ]);

    const query = `
      INSERT INTO products (name, price, stock_quantity, category_id, description, image_url, youtube_url)
      VALUES ?
    `;

    const [result] = await connection.query(query, [values]);

    await connection.commit();

    res.status(201).json({
      message: `تمت إضافة ${result.affectedRows} منتج بنجاح!`,
      insertedCount: result.affectedRows
    });
  } catch (err) {
    await connection.rollback();
    console.error('Bulk insert error:', err);
    res.status(500).json({ error: err.message });
  } finally {
    connection.release();
  }
});


router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, original_price, stock_quantity, category_id, description, image_url, youtube_url } = req.body;

    // لضمان قراءة السعر سواء جاء باسم price أو original_price
    const finalPrice = price !== undefined ? price : original_price;

    let query = '';
    let queryParams = [];

    if (req.file) {
      // صورة جديدة مرفوعة محلياً
      const newImageUrl = `/images/${req.file.filename}`;
      query = `
        UPDATE products 
        SET name = ?, price = ?, stock_quantity = ?, category_id = ?, description = ?, image_url = ?, youtube_url = ?
        WHERE id = ?
      `;
      queryParams = [name, finalPrice, stock_quantity, category_id, description, newImageUrl, youtube_url, id];
    } else if (image_url !== undefined) {
      query = `
        UPDATE products 
        SET name = ?, price = ?, stock_quantity = ?, category_id = ?, description = ?, image_url = ?, youtube_url = ?
        WHERE id = ?
      `;
      queryParams = [name, finalPrice, stock_quantity, category_id, description, image_url, youtube_url, id];
    } else {
      query = `
        UPDATE products 
        SET name = ?, price = ?, stock_quantity = ?, category_id = ?, description = ?, youtube_url = ?
        WHERE id = ?
      `;
      queryParams = [name, finalPrice, stock_quantity, category_id, description, youtube_url, id];
    }

    const [result] = await db.query(query, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    // مسح الكاش من Redis لضمان مزامنة الكميات والسعر فوراً
    try {
      const stockKey = `product:stock:${id}`;
      await redis.del(stockKey);
    } catch (redisErr) {
      console.error('Redis deletion error:', redisErr.message);
    }

    res.json({ message: 'تم تحديث البيانات بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const [product] = await db.query('SELECT image_url FROM products WHERE id = ?', [id]);

    if (product.length === 0) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
    }

    await db.query('DELETE FROM products WHERE id = ?', [id]);
    try {
      const stockKey = `product:stock:${id}`;
      await redis.del(stockKey);
    } catch (redisErr) {
      console.error('Redis deletion error on product delete:', redisErr.message);
    }

    if (product[0].image_url && product[0].image_url.startsWith('/images/')) {
      const imageName = path.basename(product[0].image_url);
      const filePath = path.join(__dirname, '../images', imageName);

      fs.unlink(filePath, (err) => {
        if (err) console.error('لم يتم العثور على الملف لحذفه:', err.message);
      });
    }

    res.json({ message: 'تم حذف المنتج وصورته بنجاح' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


router.post('/search-image', async (req, res) => {
  try {
    const { query } = req.body;

    if (!query || !query.trim()) {
      return res.status(400).json({ message: 'يرجى إدخال اسم المنتج للبحث' });
    }

    const apiKey = process.env.SERPER_API_KEY;
    if (!apiKey) {
      console.error('❌ خطأ: SERPER_API_KEY غير معرّف في متغيرات البيئة.');
      return res.status(500).json({ message: 'مفتاح Serper API غير معرّف في السيرفر' });
    }

    const cleanQuery = query.trim();

  
    const response = await axios.post(
      'https://google.serper.dev/images',
      {
        q: cleanQuery,
        num: 1 
      },
      {
        headers: {
          'X-API-KEY': apiKey,
          'Content-Type': 'application/json'
        }
      }
    );

    const images = response.data?.images;

    if (!images || images.length === 0) {
      return res.status(404).json({ message: 'لم يتم العثور على أي صورة تطابق هذا البحث' });
    }

    // رابط الصورة المباشر من نتائج Google
    const imageUrl = images[0].imageUrl;

    return res.json({ imageUrl });

  } catch (error) {
    const errorDetails = error.response?.data || error.message;
    console.error('Serper Image Search Error:', errorDetails);

    return res.status(500).json({ 
      message: 'حدث خطأ أثناء جلب الصورة من Serper', 
      error: typeof errorDetails === 'object' ? JSON.stringify(errorDetails) : errorDetails 
    });
  }
});

module.exports = router;