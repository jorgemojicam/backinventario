const { pool } = require('../config/db');

/*
  Tabla `user`: SOLO datos de perfil. No contiene password.
  Las credenciales viven en `cuentas_acceso` (ver cuentaAcceso.repository.js).
*/

async function findAll({ limit = 50, offset = 0 } = {}) {
  const [rows] = await pool.query(
    'SELECT id, firstname,lastname, email, created_at, updated_at FROM user ORDER BY id DESC LIMIT ? OFFSET ?',
    [Number(limit), Number(offset)]
  );
  return rows;
}

async function count() {
  const [rows] = await pool.query('SELECT COUNT(*) AS total FROM user');
  return rows[0].total;
}

async function findById(id) {
  const [rows] = await pool.query(
    'SELECT id, firstname,lastname, email, created_at, updated_at FROM user WHERE id = ?',
    [id]
  );
  return rows[0] || null;
}

async function findByEmail(email) {
  const [rows] = await pool.query(
    'SELECT id, firstname,lastname, email, created_at, updated_at FROM user WHERE email = ?',
    [email]
  );
  return rows[0] || null;
}

async function create({ firstname, email }) {
  const [result] = await pool.query('INSERT INTO user (firstname,lastname, email) VALUES (?, ?)', [
    firstname,
    email,
  ]);
  return findById(result.insertId);
}

async function update(id, { firstname, email }) {
  await pool.query('UPDATE user SET firstname = ?,lastname=?, email = ? WHERE id = ?', [
    firstname,
    email,
    id,
  ]);
  return findById(id);
}

async function remove(id) {
  // El DELETE CASCADE en cuentas_acceso elimina la cuenta de acceso asociada automáticamente.
  const [result] = await pool.query('DELETE FROM user WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  count,
  findById,
  findByEmail,
  create,
  update,
  remove,
};
