const mysql = require('mysql2/promise');
require('dotenv').config();

// Pool de conexiones: reutiliza conexiones en lugar de abrir una por consulta.
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'test',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
  queueLimit: 0,
  dateStrings: true,
});

// Verifica la conexión al iniciar la app (falla rápido si algo está mal).
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Conexión a MySQL establecida correctamente');
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error.message);
    throw error;
  }
}

module.exports = { pool, testConnection };
