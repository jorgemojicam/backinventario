const productoService = require('../services/producto.service');

async function listar(req, res) {
  const { page, pageSize, search } = req.query;
  const resultado = await productoService.listar({ page, pageSize, search });
  res.json({ success: true, ...resultado });
}

async function obtenerPorId(req, res) {
  const producto = await productoService.obtenerPorId(req.params.id);
  res.json({ success: true, data: producto });
}

async function crear(req, res) {
  const producto = await productoService.crear(req.body);
  res.status(201).json({ success: true, data: producto });
}

async function actualizar(req, res) {
  const producto = await productoService.actualizar(req.params.id, req.body);
  res.json({ success: true, data: producto });
}

async function eliminar(req, res) {
  await productoService.eliminar(req.params.id);
  res.status(204).send();
}

async function listarPorUsuario(req, res) {
  const productos = await productoService.listarPorUsuario(req.params.usuarioId);
  res.json({ success: true, data: productos });
}

module.exports = { listar, obtenerPorId, crear, actualizar, eliminar, listarPorUsuario };