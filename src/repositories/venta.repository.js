const { pool } = require('../config/db');

// --- Escritura: se hace dentro de la transacción orquestada por venta.service.js ---

async function crearVenta(connection, { user_id, metodo_pago, total }) {
  const [result] = await connection.query(
    'INSERT INTO ventas (user_id, metodo_pago, total) VALUES (?, ?, ?)',
    [user_id || null, metodo_pago, total]
  );
  return result.insertId;
}

async function agregarDetalle(connection, { venta_id, product_id, cantidad, precio_unitario, subtotal }) {
  await connection.query(
    'INSERT INTO venta_detalle (venta_id, product_id, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)',
    [venta_id, product_id, cantidad, precio_unitario, subtotal]
  );
}

// --- Lectura ---

async function findAll({ limit = 20, offset = 0, desde, hasta } = {}) {
  const condiciones = [];
  const params = [];

  if (desde) {
    condiciones.push('v.created_at >= ?');
    params.push(desde);
  }
  if (hasta) {
    condiciones.push('v.created_at <= ?');
    params.push(hasta);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

  const [rows] = await pool.query(
    `SELECT v.*, u.firstname AS vendedor_nombre
     FROM ventas v
     LEFT JOIN user u ON u.id = v.user_id
     ${where}
     ORDER BY v.created_at DESC, v.id DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), Number(offset)]
  );
  return rows;
}

async function count({ desde, hasta } = {}) {
  const condiciones = [];
  const params = [];

  if (desde) {
    condiciones.push('created_at >= ?');
    params.push(desde);
  }
  if (hasta) {
    condiciones.push('created_at <= ?');
    params.push(hasta);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [rows] = await pool.query(`SELECT COUNT(*) AS total FROM ventas ${where}`, params);
  return rows[0].total;
}

async function findById(id) {
  const [ventaRows] = await pool.query(
    `SELECT v.*, u.firstname AS vendedor_nombre
     FROM ventas v
     LEFT JOIN user u ON u.id = v.user_id
     WHERE v.id = ?`,
    [id]
  );
  const venta = ventaRows[0];
  if (!venta) return null;

  const [items] = await pool.query(
    `SELECT vd.*, p.name AS producto_nombre
     FROM venta_detalle vd
     INNER JOIN product p ON p.id = vd.product_id
     WHERE vd.venta_id = ?`,
    [id]
  );

  return { ...venta, items };
}

// Suma de ingresos en un rango de fechas (para el resumen del POS: "ventas de hoy", etc.)
async function sumaIngresos({ desde, hasta } = {}) {
  const condiciones = [];
  const params = [];

  if (desde) {
    condiciones.push('created_at >= ?');
    params.push(desde);
  }
  if (hasta) {
    condiciones.push('created_at <= ?');
    params.push(hasta);
  }

  const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(total), 0) AS total_ingresos, COUNT(*) AS cantidad_ventas
     FROM ventas ${where}`,
    params
  );
  return rows[0];
}

module.exports = { crearVenta, agregarDetalle, findAll, count, findById, sumaIngresos };
