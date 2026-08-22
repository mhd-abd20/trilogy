
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import '../../styles/OrderHistory.css'; 

const SERVER_ORIGIN = 'http://localhost:8080'; 



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
  if (!imagePath) return PLACEHOLDER_IMAGE;
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
  const navigate = useNavigate();

  useEffect(() => {
  
    const userId = localStorage.getItem('userId');

    
    if (!userId) {
      setError('يرجى تسجيل الدخول لعرض تاريخ طلباتك.');
      setLoading(false);
      return;
    }
    const fetchOrderHistory = async () => {
      try {
        const response = await axios.get(`${SERVER_ORIGIN}/api/orders/user/${userId}`);
        setOrders(response.data || []);
      } catch (err) {
        console.error('Error fetching history:', err);
        setError(err.response?.data?.error || 'حدث خطأ أثناء تحميل تاريخ الطلبات.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderHistory();
  }, [navigate]);
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

  if (orders.length === 0) {
    return (
      <div className="history-container">
        <div className="history-header">
          <h2>تاريخ طلباتي</h2>
        </div>
        <div className="state-message empty-state">
          <p>لم تقم بأي عمليات شراء حتى الآن.</p>
          <Link to="/products" className="btn-primary">ابدأ التسوق الآن</Link>
        </div>
      </div>
    );
  }


  return (
    <div className="history-container">
      <div className="history-header">
        <h2>تاريخ طلباتي ({orders.length})</h2>
      </div>

      <div className="orders-list">
        {orders.map((order) => (
          <div key={order.order_id} className="order-card">
         
            <div className="order-card-header">
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
              {order.items && order.items.map((item) => (
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
    </div>
  );
}