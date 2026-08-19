const perfilService = require('../services/perfil.service');

async function listar(req, res) {
  const perfiles = await perfilService.listar();
  res.json({ success: true, data: perfiles });
}

async function obtenerPorId(req, res) {
  const perfil = await perfilService.obtenerPorId(req.params.id);
  res.json({ success: true, data: perfil });
}

async function crear(req, res) {
  const perfil = await perfilService.crear(req.body);
  res.status(201).json({ success: true, data: perfil });
}

async function listarPerfilesDeUsuario(req, res) {
  const perfiles = await perfilService.listarPerfilesDeUsuario(req.params.usuarioId);
  res.json({ success: true, data: perfiles });
}

async function asignarPerfil(req, res) {
  const perfiles = await perfilService.asignarPerfil(req.params.usuarioId, req.body.perfil_id);
  res.status(201).json({ success: true, data: perfiles });
}

async function quitarPerfil(req, res) {
  const perfiles = await perfilService.quitarPerfil(req.params.usuarioId, req.params.perfilId);
  res.json({ success: true, data: perfiles });
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  listarPerfilesDeUsuario,
  asignarPerfil,
  quitarPerfil,
};
