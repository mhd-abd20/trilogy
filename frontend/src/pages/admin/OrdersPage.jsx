import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/orders.css'; 

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://trilogy-production.up.railway.app';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/api/orders/all-orders`);
      setOrders(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'حدث خطأ أثناء تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = orders.filter((order) => {
    if (filterType === 'ALL') return true;
    return order.user_type === filterType;
  });

  if (loading) return <div className="loading-spinner">جاري تحميل عمليات الشراء...</div>;
  if (error) return <div className="error-banner">{error}</div>;

  return (
    <div className="orders-container">
      <h2>جدول المبيعات وعمليات الشراء</h2>

      {/* أدوات التصفية */}
      <div className="filter-tabs">
        <button 
          className={filterType === 'ALL' ? 'active' : ''} 
          onClick={() => setFilterType('ALL')}
        >
          الكل ({orders.length})
        </button>
        <button 
          className={filterType === 'Client' ? 'active' : ''} 
          onClick={() => setFilterType('Client')}
        >
          مستخدمين مسجلين ({orders.filter(o => o.user_type === 'Client').length})
        </button>
        <button 
          className={filterType === 'Guest' ? 'active' : ''} 
          onClick={() => setFilterType('Guest')}
        >
          زوار ({orders.filter(o => o.user_type === 'Guest').length})
        </button>
      </div>

      {/* جدول البيانات */}
      <div className="table-responsive">
        <table className="orders-table">
          <thead>
            <tr>
              <th>رقم الطلب</th>
              <th>اسم المشتري</th>
              <th>البريد الإلكتروني</th>
              <th>رقم الهاتف</th>
              <th>نوع الحساب</th>
              <th>المبلغ الكلي</th>
              <th>تاريخ الطلب</th>
              <th>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center' }}>لا توجد عمليات شراء معروضة</td>
              </tr>
            ) : (
              filteredOrders.map((order) => (
                <tr key={order.order_id}>
                  <td>#{order.order_id}</td>
                  <td><strong>{order.customer_name || 'غير معروف'}</strong></td>
                  <td>{order.customer_email}</td>
                  <td>{order.customer_phone}</td>
                  <td>
                    <span className={`badge badge-${order.user_type.toLowerCase()}`}>
                      {order.user_type === 'Client' ? 'عميل مسجل' : 'زائر'}
                    </span>
                  </td>
                  <td>${Number(order.total_amount).toFixed(2)}</td>
                  <td>{new Date(order.created_at).toLocaleDateString()}</td>
                  <td>
                    <span className={`status-tag ${order.status}`}>
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersPage;