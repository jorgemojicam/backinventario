const { pool } = require('../config/db');

async function findByProductoId(productoId, { limit = 50, offset = 0 } = {}) {
  const [rows] = await pool.query(
    `SELECT * FROM movimientos_stock
     WHERE product_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [productoId, Number(limit), Number(offset)]
  );
  return rows;
}

async function countByProductoId(productoId) {
  const [rows] = await pool.query(
    'SELECT COUNT(*) AS total FROM movimientos_stock WHERE product_id = ?',
    [productoId]
  );
  return rows[0].total;
}

// Registra el movimiento y actualiza product.stock de forma atómica.
// Usa SELECT ... FOR UPDATE para bloquear la fila del producto y evitar condiciones de carrera
// si dos movimientos llegan al mismo tiempo (ej. dos ventas simultáneas del mismo producto).
async function registrarMovimiento(connection, { producto_id, tipo, cantidad, motivo, usuario_id, nota }) {
  const [rows] = await connection.query(
    'SELECT stock FROM product WHERE id = ? FOR UPDATE',
    [producto_id]
  );
  
  if (!rows[0]) {
    const err = new Error('Producto no encontrado');
    err.statusCode = 404;
    throw err;
  }

  const stockActual = rows[0].stock;
  const delta = tipo === 'entrada' ? cantidad : -cantidad;
  const stockResultante = stockActual + delta;

  if (stockResultante < 0) {
    const err = new Error('Stock insuficiente para registrar la salida');
    err.statusCode = 409;
    throw err;
  }

  await connection.query('UPDATE product SET stock = ? WHERE id = ?', [
    stockResultante,
    producto_id,
  ]);

  const [result] = await connection.query(
    `INSERT INTO movimientos_stock
      (product_id, tipo, cantidad, motivo, stock_resultante, user_id, nota)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [producto_id, tipo, cantidad, motivo, stockResultante, usuario_id || null, nota || null]
  );

  return { id: result.insertId, stock_resultante: stockResultante };
}

// Recalcula el stock de un producto sumando todo su historial de movimientos.
// Útil para auditoría o si alguna vez sospechas que `product.stock` se desincronizó.
async function recalcularStock(productoId) {
  const [rows] = await pool.query(
    `SELECT COALESCE(SUM(CASE WHEN tipo = 'entrada' THEN cantidad ELSE -cantidad END), 0) AS stock
     FROM movimientos_stock WHERE product_id = ?`,
    [productoId]
  );
  return rows[0].stock;
}

module.exports = { findByProductoId, countByProductoId, registrarMovimiento, recalcularStock };