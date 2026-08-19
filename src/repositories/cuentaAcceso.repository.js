const { pool } = require('../config/db');

/*
  Tabla `access_account`: única tabla que conoce password_hash.
  Relación 1 a 1 con `user` mediante user_id.
*/

async function findByUsuarioId(usuarioId) {
  const [rows] = await pool.query('SELECT * FROM access_account WHERE user_id = ?', [
    usuarioId,
  ]);
  return rows[0] || null;
}

// Trae la cuenta de acceso junto con el email del usuario, útil para el login (se busca por email).
async function findByEmail(email) {
  const [rows] = await pool.query(
    `SELECT ca.*, u.email, u.firstname
     FROM access_account ca
     INNER JOIN user u ON u.id = ca.user_id
     WHERE u.email = ?`,
    [email]
  );
  return rows[0] || null;
}

async function create({ user_id, password_hash }) {
  const [result] = await pool.query(
    'INSERT INTO access_account (user_id, password_hash) VALUES (?, ?)',
    [user_id, password_hash]
  );
  return findByUsuarioId(user_id) && result.insertId;
}

async function updatePasswordHash(usuarioId, password_hash) {
  await pool.query('UPDATE access_account SET password_hash = ? WHERE user_id = ?', [
    password_hash,
    usuarioId,
  ]);
}

async function registrarLoginExitoso(usuarioId) {
  await pool.query(
    'UPDATE access_account SET intentos_fallidos = 0, bloqueado_hasta = NULL, ultimo_login = NOW() WHERE user_id = ?',
    [usuarioId]
  );
}

async function registrarLoginFallido(usuarioId, { maxIntentos = 5, bloqueoMinutos = 15 } = {}) {
  const [rows] = await pool.query(
    'UPDATE access_account SET intentos_fallidos = intentos_fallidos + 1 WHERE user_id = ?',
    [usuarioId]
  );

  const cuenta = await findByUsuarioId(usuarioId);
  if (cuenta && cuenta.intentos_fallidos >= maxIntentos) {
    await pool.query(
      'UPDATE access_account SET bloqueado_hasta = DATE_ADD(NOW(), INTERVAL ? MINUTE) WHERE user_id = ?',
      [bloqueoMinutos, usuarioId]
    );
  }
  return rows;
}

async function remove(usuarioId) {
  const [result] = await pool.query('DELETE FROM access_account WHERE user_id = ?', [
    usuarioId,
  ]);
  return result.affectedRows > 0;
}

module.exports = {
  findByUsuarioId,
  findByEmail,
  create,
  updatePasswordHash,
  registrarLoginExitoso,
  registrarLoginFallido,
  remove,
};
