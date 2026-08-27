// utils/mailer.js
const nodemailer = require('nodemailer');

// إعداد خادم الإرسال
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS  // App Password الخاص بـ Gmail
  }
});

// دالة إرسال إشعار العرض الجديد
const sendPromotionNotification = async (userEmails, promoTitle) => {
  if (!userEmails || userEmails.length === 0) return;

  const mailOptions = {
    from: `"متجرنا الإلكتروني" <${process.env.EMAIL_USER}>`,
    bcc: userEmails, // الإرسال للجميع دفعة واحدة وبسرية
    subject: `🔥 عرض جديد: ${promoTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
        <h2 style="color: #2b2d42;">تم إطلاق عرض جديد! 🎉</h2>
        <h3 style="color: #e63946;">${promoTitle}</h3>
        <p>مرحباً بك، يسعدنا إبلاغك بأنه تم تنزيل عرض جديد ومميز في المتجر.</p>
        <p>سارع بالدخول للموقع واستكشاف المنتجات المشمولة بالعرض قبل انتهاء المدة!</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('تم إرسال إشعارات العرض الجديد للمشتركين بنجاح.');
  } catch (error) {
    console.error('خطأ في إرسال إيميل العرض:', error);
  }
};

module.exports = { sendPromotionNotification };