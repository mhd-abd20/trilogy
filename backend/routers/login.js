const express = require('express');
const router = express.Router();
const db = require('../db');
const bcrypt = require('bcrypt');


router.post('/register', async (req, res) => {
  const { name, email, password, phone, address } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'الرجاء تعبئة جميع الحقول المطلوبة' });
  }

  try {
   
    const [existingUsers] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'البريد الإلكتروني مُسجل بالفعل' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertSql = 'INSERT INTO users (name, email, password, phone, address,role,subscribe_to_newsletter) VALUES (?, ?, ?, ?, ?,"client",0)';
    await db.query(insertSql, [name, email, hashedPassword, phone || null, address || null]);

    return res.status(201).json({ message: 'تم إنشاء الحساب بنجاح!' });

  } catch (err) {
    console.error("Register Error:", err);
    return res.status(500).json({ message: 'فشل إنشاء الحساب: ' + err.message });
  }
});


router.post('/', async (req, res) => {
  console.log("Request received with body:", req.body);
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'الرجاء ادخال البريد الالكتروني وكلمة السر' });
  }

  try {
    const [results] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

    if (!results || results.length === 0) {
      return res.status(400).json({ message: "الايميل او كلمة المرور غير صحيحة" });
    }

    const user = results[0];

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ message: "الايميل او كلمة المرور غير صحيحة" });
    }

    return res.status(200).json({
      message: "تم تسجيل الدخول بنجاح",
      user: { id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role}
    });

  } catch (err) {
    console.error("Login Error:", err);
    return res.status(500).json({ message: 'خطأ في السيرفر أثناء معالجة الطلب' });
  }
});

module.exports = router;