const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { timeframe } = req.query;

    // استخدام SQL Prepared Statement وحماية القيمة مع خريطة مقبولة Safe Mapping
    const timeIntervals = {
      '24h': '24 HOUR',
      'month': '30 DAY',
      'week': '7 DAY'
    };
    
    const selectedInterval = timeIntervals[timeframe] || timeIntervals['week'];

    // تشغيل جميع الاستعلامات بالتوازي لرفع الأداء بشكل ممتاز
    const [
      [totalsRows],
      [topProductsRows],
      [categorySalesRows]
    ] = await Promise.all([
      
      // 1. حساب الإجمالي بدون تكرار (فصل حساب المبيعات عن القطع)
      db.query(`
        SELECT 
          (SELECT COALESCE(SUM(total_amount), 0) FROM orders WHERE created_at >= NOW() - INTERVAL ${selectedInterval}) AS totalSales,
          (SELECT COUNT(id) FROM orders WHERE created_at >= NOW() - INTERVAL ${selectedInterval}) AS totalOrders,
          (SELECT COALESCE(SUM(oi.quantity), 0) 
           FROM order_items oi 
           JOIN orders o ON oi.order_id = o.id 
           WHERE o.created_at >= NOW() - INTERVAL ${selectedInterval}) AS totalItems    
      `),

      // 2. المنتجات الأكثر مبيعاً
      db.query(`
        SELECT 
          p.name,
          COALESCE(SUM(oi.quantity), 0) AS salesCount,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        WHERE o.created_at >= NOW() - INTERVAL ${selectedInterval}
        GROUP BY p.id, p.name
        ORDER BY salesCount DESC
        LIMIT 5
      `),

      // 3. توزيع المبيعات حسب الفئة
      db.query(`
        SELECT 
          COALESCE(c.name, 'غير محدد') AS name,
          COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS value
        FROM order_items oi
        JOIN orders o ON oi.order_id = o.id
        JOIN products p ON oi.product_id = p.id
        LEFT JOIN categories c ON p.category_id = c.id
        WHERE o.created_at >= NOW() - INTERVAL ${selectedInterval}
        GROUP BY c.id, c.name
        ORDER BY value DESC
      `)
    ]);

    const totals = totalsRows[0] || {};

    res.json({
      totalSales: Number(totals.totalSales || 0),
      totalOrders: Number(totals.totalOrders || 0),
      totalItems: Number(totals.totalItems || 0),
      topProducts: topProductsRows.map(item => ({
        ...item,
        salesCount: Number(item.salesCount),
        revenue: Number(item.revenue)
      })),
      categorySales: categorySalesRows.map(item => ({
        ...item,
        value: Number(item.value)
      }))
    });

  } catch (error) {
    console.error("Sales Analytics Error:", error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات المبيعات", error: error.message });
  }
});

module.exports = router;