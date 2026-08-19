const usuarioRepository = require('../repositories/usuario.repository');
const ApiError = require('../utils/ApiError');

async function listar({ page = 1, pageSize = 20 } = {}) {
  const limit = Math.min(Number(pageSize) || 20, 100);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [data, total] = await Promise.all([
    usuarioRepository.findAll({ limit, offset }),
    usuarioRepository.count(),
  ]);

  return {
    data,
    pagination: { page: Number(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function obtenerPorId(id) {
  const usuario = await usuarioRepository.findById(id);
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');
  return usuario;
}

function validarDatosPerfil({ firstname, email }) {
  const errores = [];
  if (!firstname || firstname.trim().length < 2) errores.push('El firstname debe tener al menos 2 caracteres');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errores.push('El email no es válido');

  if (errores.length > 0) throw ApiError.badRequest('Datos inválidos', errores);
}

// Nota: la creación de usuarios con contraseña se hace en auth.service.js -> registrar(),
// porque requiere escribir en dos tablas (usuarios + cuentas_acceso) de forma transaccional.

async function actualizar(id, datos) {
  await obtenerPorId(id); // valida existencia
  validarDatosPerfil(datos);

  if (datos.email) {
    const existente = await usuarioRepository.findByEmail(datos.email);
    if (existente && String(existente.id) !== String(id)) {
      throw ApiError.conflict('Ya existe un usuario con ese email');
    }
  }

  return usuarioRepository.update(id, datos);
}

async function eliminar(id) {
  await obtenerPorId(id); // valida existencia
  return usuarioRepository.remove(id);
}

module.exports = { listar, obtenerPorId, actualizar, eliminar, validarDatosPerfil };
