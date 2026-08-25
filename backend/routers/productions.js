const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');


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
      ) AS active_promos ON p.id = active_promos.product_id;
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


router.put('/:id', upload.single('image'), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock_quantity, category_id, description, image_url , youtube_url } = req.body;

    let query = '';
    let queryParams = [];

    if (req.file) {
      // صورة جديدة مرفوعة محلياً
      const newImageUrl = `/images/${req.file.filename}`;
      query = `
        UPDATE products 
        SET name = ?, price = ?, stock_quantity = ?, category_id = ?, description = ?, image_url = ? , youtube_url= ?
        WHERE id = ?
      `;
      queryParams = [name, price, stock_quantity, category_id, description, newImageUrl, youtube_url, id];
    } else if (image_url !== undefined) {
   
      query = `
        UPDATE products 
        SET name = ?, price = ?, stock_quantity = ?, category_id = ?, description = ?, image_url = ? , youtube_url=?
        WHERE id = ?
      `;
      queryParams = [name, price, stock_quantity, category_id, description, image_url, youtube_url, id];
    } else {
      
      query = `
        UPDATE products 
        SET name = ?, price = ?, stock_quantity = ?, category_id = ?, description = ? , youtube_url = ?
        WHERE id = ?
      `;
      queryParams = [name, price, stock_quantity, category_id, description, youtube_url,  id];
    }

    const [result] = await db.query(query, queryParams);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'المنتج غير موجود' });
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


router.post('/generate-image', async (req, res) => {
  try {
    const { prompt } = req.body;

    if (!prompt || prompt.trim() === '') {
      return res.status(400).json({ message: 'يرجى إدخال وصف للصورة' });
    }

    console.log('الوصف الأصلي (عربي):', prompt);

    // 1. ترجمة النص تلقائياً إلى الإنجليزية (أو إبقاؤه إن كان إنجليزياً بالأصل)
    const translationRes = await translate(prompt.trim(), { to: 'en' });
    const englishPrompt = translationRes.text;

    console.log('الوصف بعد الترجمة (إنجليزي):', englishPrompt);

    // 2. تنظيف الوصف المترجم وتحويله لـ URL Safe
    const encodedPrompt = encodeURIComponent(englishPrompt);
    
    // 3. إضافة Seed عشوائي وتحديد نموذج قوي مثل flux في Pollinations
    const randomSeed = Math.floor(Math.random() * 1000000);

    // استخدام نموذج flux للحصول على نتائج عالية الجودة جداً لصور المنتجات
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=800&height=800&seed=${randomSeed}&model=flux&nologo=true`;

    res.json({ 
      imageUrl,
      translatedPrompt: englishPrompt // اختياري: لإرجاع النص المترجم للفرونت إند إن أردت رؤيته
    });

  } catch (error) {
    console.error('Image Generation Error:', error);
    res.status(500).json({ message: 'حدث خطأ أثناء توليد الصورة' });
  }
});

module.exports = router;