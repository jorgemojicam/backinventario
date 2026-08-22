const { pool } = require('../config/db');

/*
  Ajusta los names de columnas a los de tu tabla real `product`.
  Se asume una estructura típica: id, name, description, price, stock, user_id, created_at, updated_at
*/

async function findAll({ limit = 50, offset = 0, search = '' } = {}) {
  if (search) {
    const [rows] = await pool.query(
      'SELECT * FROM product WHERE name LIKE ? ORDER BY id DESC LIMIT ? OFFSET ?',
      [`%${search}%`, Number(limit), Number(offset)]
    );
    return rows;
  }

  const [rows] = await pool.query(
    'SELECT * FROM product ORDER BY id DESC LIMIT ? OFFSET ?',
    [Number(limit), Number(offset)]
  );
  return rows;
}

async function count({ search = '' } = {}) {
  if (search) {
    const [rows] = await pool.query(
      'SELECT COUNT(*) AS total FROM product WHERE name LIKE ?',
      [`%${search}%`]
    );
    return rows[0].total;
  }

  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM product');
  return rows[0].total;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM product WHERE id = ?', [id]);  
  return rows[0] || null;
}

async function findByUsuarioId(usuarioId) {
  const [rows] = await pool.query('SELECT * FROM product WHERE user_id = ?', [usuarioId]);
  return rows;
}

async function create({ name, description, price, stock, user_id }) {
  const [result] = await pool.query(
    'INSERT INTO product (name, description, price, stock, user_id) VALUES (?, ?, ?, ?, ?)',
    [name, description, price, stock, user_id]
  );
  return findById(result.insertId);
}

// No incluye `stock` a propósito: el stock solo se modifica desde
// movimientoStock.repository.js (registrarMovimiento), para mantener el ledger consistente.
async function update(id, { name, description, price }) {
  await pool.query('UPDATE product SET name = ?, description = ?, price = ? WHERE id = ?', [
    name,
    description,
    price,
    id,
  ]);
  return findById(id);
}

async function remove(id) {
  const [result] = await pool.query('DELETE FROM product WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  count,
  findById,
  findByUsuarioId,
  create,
  update,
  remove,
};