import React, { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import '../../styles/salesAnalytics.css';

// ألوان مخصصة للشارت
const COLORS = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function SalesAnalytics() {
  const [timeframe, setTimeframe] = useState('week'); // '24h', 'week', 'month'
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({
    totalSales: 0,
    totalOrders: 0,
    topProducts: [],
    categorySales: []
  });

  useEffect(() => {
    fetchSalesData(timeframe);
  }, [timeframe]);

  const fetchSalesData = async (selectedTimeframe) => {
    setLoading(true);
    try {
      // استبدل هذا الاستدعاء بطلب الـ API الحقيقي من الـ Backend الخاص بك
      // مثال: const res = await getSalesAnalytics(selectedTimeframe);
      
      // بيانات تجريبية للعرض:
      setTimeout(() => {
        if (selectedTimeframe === '24h') {
          setData({
            totalSales: 450.00,
            totalOrders: 12,
            topProducts: [
              { name: 'سماعة لاسلكية', salesCount: 8, revenue: 240 },
              { name: 'شاحن سريع', salesCount: 5, revenue: 100 },
              { name: 'غطاء حماية', salesCount: 4, revenue: 60 },
            ],
            categorySales: [
              { name: 'إلكترونيات', value: 340 },
              { name: 'إكسسوارات', value: 110 },
            ]
          });
        } else if (selectedTimeframe === 'week') {
          setData({
            totalSales: 3200.50,
            totalOrders: 85,
            topProducts: [
              { name: 'سماعة لاسلكية', salesCount: 35, revenue: 1050 },
              { name: 'ساعة ذكية', salesCount: 22, revenue: 1100 },
              { name: 'شاحن سريع', salesCount: 18, revenue: 360 },
              { name: 'كابل Type-C', salesCount: 15, revenue: 150 },
            ],
            categorySales: [
              { name: 'إلكترونيات', value: 2150 },
              { name: 'إكسسوارات', value: 850 },
              { name: 'أجهزة منزلية', value: 200.5 },
            ]
          });
        } else {
          // month
          setData({
            totalSales: 12800.00,
            totalOrders: 340,
            topProducts: [
              { name: 'ساعة ذكية', salesCount: 90, revenue: 4500 },
              { name: 'سماعة لاسلكية', salesCount: 85, revenue: 2550 },
              { name: 'باور بنك', salesCount: 60, revenue: 1800 },
              { name: 'شاحن سريع', salesCount: 55, revenue: 1100 },
            ],
            categorySales: [
              { name: 'إلكترونيات', value: 7050 },
              { name: 'إكسسوارات', value: 3950 },
              { name: 'أجهزة منزلية', value: 1800 },
            ]
          });
        }
        setLoading(false);
      }, 300);
    } catch (err) {
      console.error("خطأ في جلب بيانات المبيعات:", err);
      setLoading(false);
    }
  };

  return (
    <div className="analytics-container">
      {/* هيدر الصفحة وأزرار التصفية */}
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
        <p className="loading-text">جاري تحضير البيانات...</p>
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
              <h3>متوسط قيمة الطلب</h3>
              <p className="kpi-value">
                ${data.totalOrders > 0 ? (data.totalSales / data.totalOrders).toFixed(2) : '0.00'}
              </p>
            </div>
          </div>

          {/* الرسم البياني لأكثر المنتجات مبيعاً */}
          <div className="charts-grid">
            <div className="chart-card">
              <h3>الأكثر مبيعاً (حسب عدد القطع)</h3>
              <div style={{ width: '100%', height: 300 }}>
                <ResponsiveContainer>
                  <BarChart data={data.topProducts} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value} قطعة`, 'المبيعات']} />
                    <Bar dataKey="salesCount" fill="#0284c7" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* الرسم البياني لتوزيع المبيعات حسب الفئة */}
            <div className="chart-card">
              <h3>المبيعات حسب الفئة ($)</h3>
              <div style={{ width: '100%', height: 300 }}>
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
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}