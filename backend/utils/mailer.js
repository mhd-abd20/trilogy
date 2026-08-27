const nodemailer = require('nodemailer');
const dns = require('dns');

// 🔹 إجبار النظام محلياً وفي الـ DNS على حل IPv4 أولاً
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // يجب أن تكون false مع 587
  family: 4,     // 👈 إجبار Nodemailer بشكل صارم على استخدام IPv4 فقط
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const sendPromotionNotification = async (userEmails, promoTitle) => {
  if (!userEmails || userEmails.length === 0) return;

  const mailOptions = {
    from: `"متجرنا الإلكتروني" <${process.env.EMAIL_USER}>`,
    bcc: userEmails,
    subject: `🔥 عرض جديد: ${promoTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
        <h2>تم إطلاق عرض جديد: <span style="color: #e63946;">${promoTitle}</span></h2>
        <p>مرحباً بك، يسعدنا إبلاغك بأنه تم تنزيل عرض جديد في المتجر!</p>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ تم إرسال البريد بنجاح! ID:', info.messageId);
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد الإلكتروني:', error);
  }
};

module.exports = { sendPromotionNotification };