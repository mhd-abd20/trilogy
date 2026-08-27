const { Resend } = require('resend');

const sendPromotionNotification = async (userEmails, promoTitle) => {
  if (!userEmails || userEmails.length === 0) return;

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error('❌ خطأ: RESEND_API_KEY غير معرف في متغيرات البيئة.');
    return;
  }

  const resend = new Resend(apiKey);

  try {
    // 🔹 في الخطة التجريبية، نرسل لكل إيميل منفصل لمنع القروض وتفادي رفض المصفوفة
    for (const email of userEmails) {
      const { data, error } = await resend.emails.send({
        from: 'onboarding@resend.dev',
        to: email, // إرسال للإيميل المخصص (يجب أن يكون إيميلك المسجل بـ Resend في الخطة المجانية)
        subject: `🔥 عرض جديد: ${promoTitle}`,
        html: `
          <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
            <h2>تم إطلاق عرض جديد: <span style="color: #e63946;">${promoTitle}</span></h2>
            <p>مرحباً بك، يسعدنا إبلاغك بأنه تم تنزيل عرض جديد في المتجر!</p>
          </div>
        `
      });

      if (error) {
        console.error(`❌ خطأ أثناء الإرسال للبريد ${email}:`, error.message);
      } else {
        console.log(`✅ تم إرسال الإيميل بنجاح إلى ${email}! ID:`, data.id);
      }
    }
  } catch (error) {
    console.error('❌ خطأ أثناء الاتصال بـ Resend:', error);
  }
};

module.exports = { sendPromotionNotification };