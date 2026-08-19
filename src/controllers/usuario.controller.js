const usuarioService = require('../services/usuario.service');

async function listar(req, res) {
  const { page, pageSize } = req.query;
  const resultado = await usuarioService.listar({ page, pageSize });
  res.json({ success: true, ...resultado });
}

async function obtenerPorId(req, res) {
  const usuario = await usuarioService.obtenerPorId(req.params.id);
  res.json({ success: true, data: usuario });
}

async function actualizar(req, res) {
  const usuario = await usuarioService.actualizar(req.params.id, req.body);
  res.json({ success: true, data: usuario });
}

async function eliminar(req, res) {
  await usuarioService.eliminar(req.params.id);
  res.status(204).send();
}

module.exports = { listar, obtenerPorId, actualizar, eliminar };
