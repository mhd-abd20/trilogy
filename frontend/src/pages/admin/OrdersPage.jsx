import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../../styles/orders.css'; 

const API_URL = import.meta.env.VITE_BACKEND_URL || 'https://trilogy-production.up.railway.app';

const OrdersPage = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('ALL'); 
  const [processingId, setProcessingId] = useState(null);

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

  const handleAcceptOrder = async (orderId) => {
    if (!window.confirm(`هل أنت متأكد من قبول الطلب رقم #${orderId}؟`)) return;

    try {
      setProcessingId(orderId);
      await axios.put(`${API_URL}/api/orders/accept/${orderId}`);

      // تحديث الحالة محلياً في الواجهة
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId ? { ...order, status: 'accepted' } : order
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'فشل قبول الطلب');
    } finally {
      setProcessingId(null);
    }
  };

  const handleDeclineOrder = async (orderId) => {
    if (!window.confirm(`هل أنت متأكد من رفض الطلب رقم #${orderId} وإرجاع المنتجات للمخزون؟`)) return;

    try {
      setProcessingId(orderId);
      await axios.put(`${API_URL}/api/orders/decline/${orderId}`);

      // تحديث الحالة محلياً في الواجهة
      setOrders((prev) =>
        prev.map((order) =>
          order.order_id === orderId ? { ...order, status: 'declined' } : order
        )
      );
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data?.error || 'فشل رفض الطلب');
    } finally {
      setProcessingId(null);
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
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan="9" style={{ textAlign: 'center' }}>لا توجد عمليات شراء معروضة</td>
              </tr>
            ) : (
              filteredOrders.map((order) => {
                const isPending = order.status === 'Pending';
                const isCurrentProcessing = processingId === order.order_id;

                return (
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
                      <span className={`status-tag status-${order.status}`}>
                        {order.status === 'pending' && 'قيد الانتظار'}
                        {order.status === 'accepted' && 'مقبول'}
                        {order.status === 'declined' && 'مرفوض'}
                        {!['pending', 'accepted', 'declined'].includes(order.status) && order.status}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          type="button"
                          disabled={!isPending || isCurrentProcessing}
                          onClick={() => handleAcceptOrder(order.order_id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: isPending ? '#16a34a' : '#cbd5e1',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isPending && !isCurrentProcessing ? 'pointer' : 'not-allowed',
                            fontSize: '13px'
                          }}
                        >
                          {isCurrentProcessing ? '...' : 'قبول'}
                        </button>

                        <button
                          type="button"
                          disabled={!isPending || isCurrentProcessing}
                          onClick={() => handleDeclineOrder(order.order_id)}
                          style={{
                            padding: '6px 12px',
                            backgroundColor: isPending ? '#dc2626' : '#cbd5e1',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '4px',
                            cursor: isPending && !isCurrentProcessing ? 'pointer' : 'not-allowed',
                            fontSize: '13px'
                          }}
                        >
                          {isCurrentProcessing ? '...' : 'رفض'}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersPage;