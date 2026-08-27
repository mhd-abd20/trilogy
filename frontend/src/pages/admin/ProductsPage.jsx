import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/OrderHistory.css'; 

const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL; 

const formatTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  return date.toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const getImageUrl = (imagePath) => {
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://') || imagePath.startsWith('data:')) {
    return imagePath;
  }
  const cleanPath = imagePath.startsWith('/') ? imagePath : `/${imagePath}`;
  return `${SERVER_ORIGIN}${cleanPath}`;
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openid, setOpenid] = useState();
  
  // 🔹 حالة الاشتراك في النشرة البريدية
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setError('يرجى تسجيل الدخول لعرض تاريخ طلباتك.');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // جلب الطلبات وجلب بيانات المستخدم معاً
        const [ordersRes, userRes] = await Promise.all([
          axios.get(`${SERVER_ORIGIN}/api/orders/user/${userId}`),
          axios.get(`${SERVER_ORIGIN}/api/users/${userId}`) // يرجى التأكد من مسار الـ endpoint ببيانات المستخدم
        ]);

        setOrders(ordersRes.data || []);
        
        // ضبط حالة الاشتراك من الداتا بيز
        if (userRes.data && userRes.data.subscribe_to_newsletter) {
          setIsSubscribed(true);
        }
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(err.response?.data?.error || 'حدث خطأ أثناء تحميل تاريخ الطلبات.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  // 🔹 دالة الاشتراك بالنشرة البريدية
  const handleSubscribe = async () => {
    const userId = localStorage.getItem('userId');
    if (!userId) return;

    try {
      setSubscribing(true);
      await axios.put(`${SERVER_ORIGIN}/api/users/${userId}/subscribe`, {
        subscribe_to_newsletter: true
      });
      setIsSubscribed(true); // تخفي الزر فوراً
      alert('تم الاشتراك في قائمة العروض والخصومات بنجاح!');
    } catch (err) {
      console.error('Error subscribing:', err);
      alert('حدث خطأ أثناء الاتصال بالسيرفر.');
    } finally {
      setSubscribing(false);
    }
  };

  if (loading) {
    return (
      <div className="history-container">
        <div className="state-message">جاري تحميل تاريخ الطلبات...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="history-container">
        <div className="state-message error-state">
          <p>{error}</p>
          <Link to="/products" className="btn-primary">الذهاب للمتجر</Link>
        </div>
      </div>
    );
  }

  const handleToggleOrder = (orderId) => {
    setOpenid((prevId) => (prevId === orderId ? null : orderId));
  };

  return (
    <div className="history-container">
      
      {/* 🔹 كارت الإشعار والزر للـ Newsletter (يظهر فقط إذا كان غير مشترك) */}
      {!isSubscribed && (
        <div className="newsletter-banner" style={{
          backgroundColor: '#f8f9fa',
          border: '1px solid #e2e8f0',
          padding: '15px 20px',
          borderRadius: '8px',
          marginBottom: '20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '15px',
          flexWrap: 'wrap'
        }}>
          <div>
            <h4 style={{ margin: '0 0 5px 0' }}>💡 هل تحب العروض والخصومات؟</h4>
            <p style={{ margin: 0, color: '#6c757d', fontSize: '0.9rem' }}>
              اشترك الآن ليصلك أحدث العروض الحصرية مباشرة على بريدك الإلكتروني.
            </p>
          </div>
          <button 
            className="btn-primary" 
            onClick={handleSubscribe} 
            disabled={subscribing}
            style={{ padding: '8px 16px', cursor: 'pointer' }}
          >
            {subscribing ? 'جاري الاشتراك...' : 'اشترك في العروض'}
          </button>
        </div>
      )}

      <div className="history-header">
        <h2>تاريخ طلباتي ({orders.length})</h2>
      </div>

      {orders.length === 0 ? (
        <div className="state-message empty-state">
          <p>لم تقم بأي عمليات شراء حتى الآن.</p>
          <Link to="/products" className="btn-primary">ابدأ التسوق الآن</Link>
        </div>
      ) : (
        <div className="orders-list">
          {orders.map((order) => (
            <div key={order.order_id} className="order-card">
              <div className="order-card-header" onClick={() => handleToggleOrder(order.order_id)}>
                <div className="order-meta">
                  <span className="order-id">طلب رقم #{order.order_id}</span>
                  <span className="order-date">{formatTimestamp(order.created_at)}</span>
                </div>
                <div className="order-total-section">
                  <span className="total-label">إجمالي الطلب</span>
                  <span className="total-price">${Number(order.total_amount).toFixed(2)}</span>
                </div>
              </div>

              <div className="order-items-list">
                {openid === order.order_id && order.items.map((item) => (
                  <div key={item.item_id} className="order-item">
                    <div className="item-image-wrapper">
                      <img 
                        src={getImageUrl(item.image_url)} 
                        alt={item.product_name} 
                      />
                    </div>
                    <div className="item-details">
                      <div className="item-name-info">
                        <h4>{item.product_name}</h4>
                        <span className="item-qty-price">
                          ${Number(item.unit_price).toFixed(2)} × {item.quantity}
                        </span>
                      </div>
                      <div className="item-price-calc">
                        ${(Number(item.unit_price) * item.quantity).toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}