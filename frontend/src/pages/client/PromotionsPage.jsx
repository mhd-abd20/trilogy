import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import '../../styles/promotionsPage.css'; 
const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;
const PromotionsPage = () => {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromotions = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${SERVER_ORIGIN}/api/promotions/active`);
        setPromotions(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('خطأ في جلب العروض:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPromotions();
  }, []);

  if (loading) return <div className="loading-state">جاري تحميل العروض...</div>;

  return (
    <div className="promotions-container">
      <h2>🔥 العروض والتخفيضات المتاحة</h2>

      {promotions.length === 0 ? (
        <div className="no-promotions">لا توجد عروض نشطة حالياً، تفقّدنا قريباً!</div>
      ) : (
        <div className="promotions-grid">
          {promotions.map((promo) => (
            <div key={promo.id} className="promo-card">
              <div className="promo-card-header">
                <h3>{promo.title}</h3>
                <span className="promo-badge">عرض لفترة محدودة</span>
              </div>

              <div className="promo-card-body">
                <p className="promo-dates">
                  📅 ينتهي في: {new Date(promo.end_date).toLocaleDateString('ar-EG')}
                </p>
              </div>

              <div className="promo-card-footer">
                <Link to={`/promotions/${promo.id}`} className="btn-view-promo">
                  استعرض منتجات العرض 👈
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromotionsPage;