const { pool } = require('../config/db');

async function findAll() {
  const [rows] = await pool.query('SELECT * FROM roles ORDER BY nombre');
  return rows;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM roles WHERE id = ?', [id]);
  return rows[0] || null;
}

async function findByNombre(nombre) {
  const [rows] = await pool.query('SELECT * FROM roles WHERE code = ?', [nombre]);
  return rows[0] || null;
}

async function create({ nombre, descripcion }) {
  const [result] = await pool.query('INSERT INTO roles (name, code,description) VALUES (?, ?, ?)', [
    nombre,
    descripcion || null,
  ]);
  return findById(result.insertId);
}

// --- Relación usuario <-> roles ---

async function findrolesDeUsuario(usuarioId) {
  const [rows] = await pool.query(
    `SELECT p.* FROM roles p
     INNER JOIN user_roles up ON up.roles_id = p.id
     WHERE up.user_id = ?
     ORDER BY p.name`,
    [usuarioId]
  );
  return rows;
}

async function asignarPerfil(usuarioId, perfilId) {
  await pool.query(
    'INSERT IGNORE INTO user_roles (user_id, roles_id) VALUES (?, ?)',
    [usuarioId, perfilId]
  );
}

async function quitarPerfil(usuarioId, perfilId) {
  const [result] = await pool.query(
    'DELETE FROM user_roles WHERE user_id = ? AND roles_id = ?',
    [usuarioId, perfilId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  findAll,
  findById,
  findByNombre,
  create,
  findrolesDeUsuario,
  asignarPerfil,
  quitarPerfil,
};
