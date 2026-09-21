import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import '../../styles/GuestCheckoutPage.css';

const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL;

export default function GuestCheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const orderPayload = location.state?.payload;

  const [guestInfo, setGuestInfo] = useState({ name: '', phone: '', email: '', address: '' });
  const [loading, setLoading] = useState(false);

  if (!orderPayload || !orderPayload.items || orderPayload.items.length === 0) {
    return (
      <div className="guest-checkout-container">
        <div className="guest-checkout-card" style={{ textAlign: 'center' }}>
          <h3>لا توجد عناصر في الطلب!</h3>
          <p className="guest-checkout-subtitle">يرجى إضافة منتجات إلى السلة أولاً قبل إكمال عملية الشراء.</p>
          <button className="btn-submit-order" onClick={() => navigate('/products')}>
            العودة للمتجر
          </button>
        </div>
      </div>
    );
  }

  const handleInputChange = (e) => setGuestInfo({ ...guestInfo, [e.target.name]: e.target.value });

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const fullOrderData = { ...guestInfo, items: orderPayload.items, totalAmount: orderPayload.totalAmount };
      const response = await axios.post(`${SERVER_ORIGIN}/api/orders/checkout-guest`, fullOrderData);

      if (response.data.success) {
        alert('تم إرسال الطلب بنجاح وتحديث المخزون!');
        localStorage.setItem('trilogy_cart', JSON.stringify([]));

        window.dispatchEvent(new Event('cartUpdated'));
        window.dispatchEvent(new CustomEvent('cartBadgeUpdated'));

        navigate('/');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'حدث خطأ أثناء إرسال الطلب');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="guest-checkout-container">
      <div className="guest-checkout-card">
        <h3>إكمال الطلب كزائر 🛒</h3>
        <p className="guest-checkout-subtitle">أدخل بيانات التواصل الخاصة بك لإتمام شحن الطلب.</p>

        <form onSubmit={handleSubmitOrder}>
          <div className="form-group">
            <label>الاسم الكامل *</label>
            <input type="text" name="name" placeholder="مثال: محمد العلي" value={guestInfo.name} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>رقم الهاتف *</label>
            <input type="tel" name="phone" placeholder="مثال: 03123456" value={guestInfo.phone} onChange={handleInputChange} required />
          </div>

          <div className="form-group">
            <label>البريد الإلكتروني (اختياري)</label>
            <input type="email" name="email" placeholder="example@mail.com" value={guestInfo.email} onChange={handleInputChange} />
          </div>

          <div className="form-group">
            <label>عنوان التوصيل *</label>
            <textarea name="address" placeholder="المدينة، الشارع، البناية..." value={guestInfo.address} onChange={handleInputChange} rows="3" required />
          </div>

          <div className="order-summary-box">
            <h4>ملخص الطلب</h4>
            <div className="order-summary-item">
              <span>عدد المنتجات:</span>
              <strong>{orderPayload.items.length}</strong>
            </div>
            <div className="order-summary-total">
              <span>المبلغ الإجمالي:</span>
              <span>${Number(orderPayload.totalAmount).toFixed(2)}</span>
            </div>
          </div>

          <button type="submit" className="btn-submit-order" disabled={loading}>
            {loading ? 'جاري إرسال الطلب...' : 'تأكيد وإرسال الطلب'}
          </button>
        </form>
      </div>
    </div>
  );
}