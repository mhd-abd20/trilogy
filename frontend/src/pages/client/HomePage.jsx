import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/HomePage.css';

const HomePage = () => {

  return (
    <div className="home-wrapper">
    
      <section className="hero-card">
        <div className="badge">✨ أحدث المنتجات والتخفيضات 2026</div>
        <h1>مرحباً بكم في <span className="highlight-text">Trilogy</span></h1>
        <p className="hero-desc">
          كل ما تحتاجونه تجدوه هنا — عالم متكامل من المنتجات المختارة بعناية لتجربة تسوق فريدة وعصرية.
        </p>

        <div className="hero-actions">
          <Link to="/products" className="btn btn-primary">
            تصفح المنتجات الآن
          </Link>
          {localStorage.getItem('userId')?(
                 <Link to="/promotions" className="btn btn-secondary">
            اخر العروضات
          </Link>
          ):(
               <Link to="/register" className="btn btn-secondary">
            إنشاء حساب جديد
          </Link>
          )}
         

        </div>
      </section>

      <section className="features-container">
        <div className="feature-card">
          <div className="icon-wrapper">🚀</div>
          <h3>توصيل سريع</h3>
          <p>شحن سريع ومباشر لجميع المناطق خلال وقت قياسي</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper">💎</div>
          <h3>جودة عالية</h3>
          <p>منتجات مضمونة 100% ومختارة بعناية فائقة</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper">🔒</div>
          <h3>دفع آمن</h3>
          <p>معاملاتك المالية محمية ببروتوكولات أمان عالية</p>
        </div>

        <div className="feature-card">
          <div className="icon-wrapper">⚡</div>
          <h3>دعم فوري</h3>
          <p>فريقنا جاهز للرد على جميع استفساراتك على مدار الساعة</p>
        </div>
      </section>

      <section className="cta-wrapper">
       {localStorage.getItem("userId") ?(
      <div className="cta-inner">
          <h2>تتبع عمليات الشراء </h2>
          <p>بإنشائك حساب في متجرنا يمكن تتبع جميع عمليات الشراء التي تقوم بها وتلقي اشعارات لكل عروضاتنا الجديدة</p>
          <Link to="/login" className="btn btn-cta"> متشرياتي</Link>
        </div>
       ):(
           <div className="cta-inner">
          <h2>جاهز لبدء تجربتك مع Trilogy؟</h2>
          <p>انضم إلى مجتمعنا وسجّل حسابك لتتمكن من حفظ سلة الشراء ومتابعة الطلبات بكل سهولة.</p>
          <Link to="/login" className="btn btn-cta">تسجيل الدخول</Link>
        </div>
       )
      } 
     
      </section>
    </div>
  );
};

export default HomePage;