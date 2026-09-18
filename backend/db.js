const mysql = require('mysql2/promise');

// config/db.js (أو المسار المعتمد لديك)
const mysql = require('mysql2/promise');
require('dotenv').config();

const db = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  

  ssl: {
    minVersion: 'TLSv1.2',
    rejectUnauthorized: true
  },

  waitForConnections: true,
  connectionLimit: 10,      
  queueLimit: 0,
  enableKeepAlive: true,     
  keepAliveInitialDelay: 10000
});


(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ تم الاتصال بنجاح بقاعدة بيانات TiDB Cloud!');
    connection.release();
  } catch (err) {
    console.error('❌ فشل الاتصال بقاعدة بيانات TiDB Cloud:', err.message);
  }
})();

module.exports = db;