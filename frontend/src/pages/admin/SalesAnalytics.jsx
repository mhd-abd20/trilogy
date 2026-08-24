import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import '../../styles/salesAnalytics.css';

const SERVER_ORIGIN = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8080';
const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SalesAnalytics() {
  const [timeframe, setTimeframe] = useState('week'); // '24h', 'week', 'month'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalItems: 0,
    topProducts: [],
    categorySales: []
  });

  useEffect(() => {
    fetchSalesData(timeframe);
  }, [timeframe]);

  const fetchSalesData = async (selectedTimeframe) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${SERVER_ORIGIN}/api/sales?timeframe=${selectedTimeframe}`);
      
      setData({
        totalSales: Number(response.data.totalSales) || 0,
        totalOrders: Number(response.data.totalOrders) || 0,
        totalItems: Number(response.data.totalItems) || 0,
        topProducts: response.data.topProducts || [],
        categorySales: response.data.categorySales || []
      });
    } catch (err) {
      console.error("خطأ في جلب بيانات المبيعات:", err);
      setError("فشل في تحميل بيانات المبيعات من السيرفر");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div>
          <h2>تحليلات المبيعات</h2>
          <p>متابعة أداء المتجر والأكثر مبيعاً</p>
        </div>

        <div className="filter-buttons">
          <button 
            className={timeframe === '24h' ? 'active' : ''} 
            onClick={() => setTimeframe('24h')}
          >
            آخر 24 ساعة
          </button>
          <button 
            className={timeframe === 'week' ? 'active' : ''} 
            onClick={() => setTimeframe('week')}
          >
            آخر أسبوع
          </button>
          <button 
            className={timeframe === 'month' ? 'active' : ''} 
            onClick={() => setTimeframe('month')}
          >
            آخر شهر
          </button>
        </div>
      </div>

      {loading ? (
        <p className="loading-text">جاري جلب البيانات من السيرفر...</p>
      ) : error ? (
        <p className="error-text" style={{ color: 'red', textAlign: 'center' }}>{error}</p>
      ) : (
        <>
          {/* بطاقات الإحصائيات السريعة */}
          <div className="kpi-grid">
            <div className="kpi-card">
              <h3>إجمالي المبيعات</h3>
              <p className="kpi-value">${data.totalSales.toFixed(2)}</p>
            </div>
            <div className="kpi-card">
              <h3>عدد الطلبات</h3>
              <p className="kpi-value">{data.totalOrders}</p>
            </div>
            <div className="kpi-card">
              <h3>إجمالي القطع المباعة</h3>
              <p className="kpi-value">{data.totalItems}</p>
            </div>
       
          </div>

          {/* الرسم البياني لأكثر المنتجات مبيعاً */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>الأكثر مبيعاً (حسب عدد القطع)</h3>
              <div style={{ width: '100%', height: 300 }}>
                {data.topProducts.length > 0 ? (
                  <ResponsiveContainer>
                    <BarChart data={data.topProducts} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} قطعة`, 'المبيعات']} />
                      <Bar dataKey="salesCount" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ textAlign: 'center', paddingTop: '100px' }}>لا توجد مبيعات في هذه الفترة</p>
                )}
              </div>
            </div>

            {/* الرسم البياني لتوزيع المبيعات حسب الفئة */}
            <div className="chart-card">
              <h3>المبيعات حسب الفئة ($)</h3>
              <div style={{ width: '100%', height: 300 }}>
                {data.categorySales.length > 0 ? (
                  <ResponsiveContainer>
                    <PieChart>
                      <Pie
                        data={data.categorySales}
                        cx="50%"
                        cy="50%"
                        outerRadius={90}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {data.categorySales.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`$${value}`, 'الإيرادات']} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p style={{ textAlign: 'center', paddingTop: '100px' }}>لا توجد بيانات للفئات في هذه الفترة</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}