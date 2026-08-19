const perfilRepository = require('../repositories/perfil.repository');
const usuarioRepository = require('../repositories/usuario.repository');
const ApiError = require('../utils/ApiError');

async function listar() {
  return perfilRepository.findAll();
}

async function obtenerPorId(id) {
  const perfil = await perfilRepository.findById(id);
  if (!perfil) throw ApiError.notFound('Perfil no encontrado');
  return perfil;
}

async function crear({ nombre, descripcion }) {
  if (!nombre || nombre.trim().length < 2) {
    throw ApiError.badRequest('El nombre del perfil debe tener al menos 2 caracteres');
  }
  const existente = await perfilRepository.findByNombre(nombre);
  if (existente) throw ApiError.conflict('Ya existe un perfil con ese nombre');

  return perfilRepository.create({ nombre: nombre.trim().toLowerCase(), descripcion });
}

async function listarPerfilesDeUsuario(usuarioId) {
  const usuario = await usuarioRepository.findById(usuarioId);
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');
  return perfilRepository.findPerfilesDeUsuario(usuarioId);
}

async function asignarPerfil(usuarioId, perfilId) {
  const usuario = await usuarioRepository.findById(usuarioId);
  if (!usuario) throw ApiError.notFound('Usuario no encontrado');

  const perfil = await perfilRepository.findById(perfilId);
  if (!perfil) throw ApiError.notFound('Perfil no encontrado');

  await perfilRepository.asignarPerfil(usuarioId, perfilId);
  return perfilRepository.findPerfilesDeUsuario(usuarioId);
}

async function quitarPerfil(usuarioId, perfilId) {
  const eliminado = await perfilRepository.quitarPerfil(usuarioId, perfilId);
  if (!eliminado) throw ApiError.notFound('El usuario no tiene ese perfil asignado');
  return perfilRepository.findPerfilesDeUsuario(usuarioId);
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  listarPerfilesDeUsuario,
  asignarPerfil,
  quitarPerfil,
};
