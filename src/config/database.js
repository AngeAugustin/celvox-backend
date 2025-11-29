import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'bankapp_dev',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Test database connection on startup
pool.getConnection()
  .then(connection => {
    console.log('✅ Database connected successfully');
    connection.release();
  })
  .catch(error => {
    console.error('❌ Database connection error:', error.message);
    if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('   → Check your DB_USER and DB_PASS in .env file');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.error('   → Database does not exist. Check DB_NAME in .env file');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('   → Cannot connect to database server. Check DB_HOST and DB_PORT');
    }
  });

export default pool;

