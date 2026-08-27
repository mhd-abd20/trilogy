const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
service:'gmail',
auth:{
    user:process.env.EMAIL_USER,
    pass:process.env.EMAIL_PASS
}
});


const sendPromotionNotification = async (userEmails, promoTitle) => {

  const mailOptions = {
    from: `"متجرنا الإلكتروني" <${process.env.EMAIL_USER}>`,
    to:userEmails,
    subject: `🔥 عرض جديد: ${promoTitle}`,
    html:`
      <div style="font-family: Arial, sans-serif; direction: rtl; text-align: right; padding: 20px;">
        <h2>تم إطلاق عرض جديد: <span style="color: #e63946;">${promoTitle}</span></h2>
        <p>مرحباً بك، يسعدنا إبلاغك بأنه تم تنزيل عرض جديد في المتجر!</p>
      </div>
    `
}
try {
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ تم إرسال البريد بنجاح! ID:', info.messageId);
  } catch (error) {
    console.error('❌ خطأ في إرسال البريد الإلكتروني:', error);
  }

};

module.exports = { sendPromotionNotification };