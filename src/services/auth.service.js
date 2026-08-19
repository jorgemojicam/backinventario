const bcrypt = require('bcrypt');
const { pool } = require('../config/db');
const usuarioRepository = require('../repositories/usuario.repository');
const cuentaAccesoRepository = require('../repositories/cuentaAcceso.repository');
const perfilRepository = require('../repositories/perfil.repository');
const usuarioService = require('./usuario.service');
const ApiError = require('../utils/ApiError');
const { firmarToken } = require('../utils/jwt');

const SALT_ROUNDS = 12;
const MAX_INTENTOS_FALLIDOS = 5;
const BLOQUEO_MINUTOS = 15;

function validarPassword(password) {
  if (!password || password.length < 8) {
    throw ApiError.badRequest("La contraseña debe tener al menos 8 caracteres");
  }
}

// Crea el usuario (perfil) y su cuenta de acceso (password) en una sola transacción,
// para que nunca quede un usuario sin credenciales o viceversa.
async function registrar({ firstname, lastname, email, password }) {
  userervice.validarDatosPerfil({ firstname, lastname, email });
  validarPassword(password);

  const existente = await usuarioRepository.findByEmail(email);
  if (existente) throw ApiError.conflict("Ya existe un usuario con ese email");

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [resultUsuario] = await connection.query(
      "INSERT INTO user (firstname,lastname, email) VALUES (?, ?, ?)",
      [firstname, lastname, email],
    );
    const usuarioId = resultUsuario.insertId;

    await connection.query(
      "INSERT INTO access_account (user_id, password) VALUES (?, ?)",
      [usuarioId, passwordHash],
    );

    // Asigna el perfil 'usuario' por defecto (debe existir en la tabla `roles`, ver schema.sql).
    const [perfilRows] = await connection.query(
      "SELECT id FROM roles WHERE code = 'USR' LIMIT 1",
    );
    if (perfilRows[0]) {
      await connection.query(
        "INSERT IGNORE INTO user_roles (user_id, roles_id) VALUES (?, ?)",
        [usuarioId, perfilRows[0].id],
      );
    }

    await connection.commit();

    return usuarioRepository.findById(usuarioId);
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}


async function login({ email, password }) {
  if (!email || !password) throw ApiError.badRequest('Email y contraseña son obligatorios');

  const cuenta = await cuentaAccesoRepository.findByEmail(email);
  // Mensaje genérico a propósito: no revela si el email existe o no.
  const credencialesInvalidas = () => ApiError.badRequest('Credenciales inválidas');

  if (!cuenta) throw credencialesInvalidas();

  if (cuenta.bloqueado_hasta && new Date(cuenta.bloqueado_hasta) > new Date()) {
    throw ApiError.conflict('Cuenta bloqueada temporalmente por intentos fallidos. Intenta más tarde.');
  }

  const passwordValido = await bcrypt.compare(password, cuenta.password);
  if (!passwordValido) {
    await cuentaAccesoRepository.registrarLoginFallido(cuenta.user_id, {
      maxIntentos: MAX_INTENTOS_FALLIDOS,
      bloqueoMinutos: BLOQUEO_MINUTOS,
    });
    throw credencialesInvalidas();
  }

  await cuentaAccesoRepository.registrarLoginExitoso(cuenta.user_id);

  const usuario = await usuarioRepository.findById(cuenta.user_id);
  const perfiles = await perfilRepository.findrolesDeUsuario(cuenta.user_id);
  const nombresPerfiles = perfiles.map((p) => p.nombre);

  const token = firmarToken({ usuarioId: usuario.id, email: usuario.email, perfiles: nombresPerfiles });

  return { usuario, perfiles: nombresPerfiles, token };
}

async function cambiarPassword(usuarioId, { passwordActual, passwordNuevo }) {
  await usuarioService.obtenerPorId(usuarioId); // valida que el usuario existe
  validarPassword(passwordNuevo);

  const cuenta = await cuentaAccesoRepository.findByUsuarioId(usuarioId);
  if (!cuenta) throw ApiError.notFound('Cuenta de acceso no encontrada');

  const passwordValido = await bcrypt.compare(passwordActual, cuenta.password);
  if (!passwordValido) throw ApiError.badRequest('La contraseña actual no es correcta');

  const nuevoHash = await bcrypt.hash(passwordNuevo, SALT_ROUNDS);
  await cuentaAccesoRepository.updatePasswordHash(usuarioId, nuevoHash);
}

async function cambiarPassword(usuarioId, { passwordActual, passwordNuevo }) {
  await userervice.obtenerPorId(usuarioId); // valida que el usuario existe
  validarPassword(passwordNuevo);

  const cuenta = await cuentaAccesoRepository.findByUsuarioId(usuarioId);
  if (!cuenta) throw ApiError.notFound("Cuenta de acceso no encontrada");

  const passwordValido = await bcrypt.compare(passwordActual, cuenta.password);
  if (!passwordValido)
    throw ApiError.badRequest("La contraseña actual no es correcta");

  const nuevoHash = await bcrypt.hash(passwordNuevo, SALT_ROUNDS);
  await cuentaAccesoRepository.updatePasswordHash(usuarioId, nuevoHash);
}

module.exports = { registrar, login, cambiarPassword };
