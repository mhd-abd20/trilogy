const express = require('express');
const router = express.Router();
const db = require('../db');

router.get('/', async (req, res) => {
  try {
    const { timeframe } = req.query;

    let intervalCondition = "INTERVAL 7 DAY"; 
    if (timeframe === '24h') {
      intervalCondition = "INTERVAL 24 HOUR";
    } else if (timeframe === 'month') {
      intervalCondition = "INTERVAL 30 DAY";
    }

    // 1. Total Sales and Orders
    const [totals] = await db.query(`
      SELECT 
        COALESCE(SUM(total_amount), 0) AS totalSales,
        COUNT(id) AS totalOrders
      FROM orders
      WHERE created_at >= NOW() - ${intervalCondition}
    `);

    // 2. Top Selling Products
    const [topProducts] = await db.query(`
      SELECT 
        p.name,
        COALESCE(SUM(oi.quantity), 0) AS salesCount,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS revenue
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      WHERE o.created_at >= NOW() - ${intervalCondition}
      GROUP BY p.id, p.name
      ORDER BY salesCount DESC
      LIMIT 5
    `);

    // 3. Category Sales Distribution
    const [categorySales] = await db.query(`
      SELECT 
        COALESCE(c.name, 'غير محدد') AS name,
        COALESCE(SUM(oi.quantity * oi.unit_price), 0) AS value
      FROM order_items oi
      JOIN orders o ON oi.order_id = o.id
      JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE o.created_at >= NOW() - ${intervalCondition}
      GROUP BY c.id, c.name
      ORDER BY value DESC
    `);

    const totalSales = totals && totals.length > 0 ? Number(totals[0].totalSales) : 0;
    const totalOrders = totals && totals.length > 0 ? Number(totals[0].totalOrders) : 0;

    res.json({
      totalSales,
      totalOrders,
      topProducts: topProducts.map(item => ({
        ...item,
        salesCount: Number(item.salesCount),
        revenue: Number(item.revenue)
      })),
      categorySales: categorySales.map(item => ({
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