// utils/mailer.js
const dns = require('dns');
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (e) {}
require('dotenv').config();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  lookup: (hostname, options, callback) => {
    return dns.lookup(hostname, { family: 4 }, callback);
  },
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendPromotionNotification = async (userEmails, promoTitle) => {
  if (!userEmails || userEmails.length === 0) return;

  const mailOptions = {
    from: `"متجرنا الإلكتروني" <${process.env.EMAIL_USER}>`,
    to: process.env.EMAIL_USER,
    bcc: userEmails, // الإرسال لجميع المشتركين دفعة واحدة وبسرية
    subject: `🔥 عرض جديد: ${promoTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2b2d42;">تم إطلاق عرض جديد! 🎉</h2>
        <h3 style="color: #e63946;">${promoTitle}</h3>
        <p>مرحباً بك، يسعدنا إبلاغك بأنه تم تنزيل عرض جديد ومميز في المتجر.</p>
        <p>سارع بالدخول للموقع واستكشاف المنتجات المشمولة بالعرض قبل انتهاء المدة!</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ تم إرسال البريد بنجاح! ID:', info.messageId);
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد الإلكتروني:', error);
  }
};

module.exports = { sendPromotionNotification };