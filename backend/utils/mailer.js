const { Resend } = require('resend');

// 🔹 تهيئة Resend باستخدام المفتاح من ملف البيئة
const resend = new Resend(process.env.RESEND_API_KEY);

const sendPromotionNotification = async (userEmails, promoTitle) => {
  if (!userEmails || userEmails.length === 0) return;

  try {

    const data = await resend.emails.send({
      from: 'Acme <onboarding@resend.dev>', // النطاق التجريبي المجاني الموفر من Resend
      to: userEmails,
      subject: `🔥 عرض جديد: ${promoTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
          <h2>تم إطلاق عرض جديد: <span style="color: #e63946;">${promoTitle}</span></h2>
          <p>مرحباً بك، يسعدنا إبلاغك بأنه تم تنزيل عرض جديد في المتجر!</p>
        </div>
      `
    });

    console.log('✅ تم إرسال الإيميلات بنجاح عبر Resend! ID:', data.id);
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد الإلكتروني:', error);
  }
};

module.exports = { sendPromotionNotification };