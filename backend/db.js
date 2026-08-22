const mysql = require('mysql2/promise');

const db = mysql.createPool({
  host: 'sakura.proxy.rlwy.net',
  user: 'root',
  password: 'uZtmTeorKRmpNHCtRvKUHEUrsOdIuhjQ',
  database: 'railway',
  port:'48302',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

console.log('Connected to Database Pool with Promise support');



module.exports = db;