const ventaService = require('../services/venta.service');

async function registrar(req, res) {
  const { metodo_pago, items } = req.body;
  const venta = await ventaService.registrarVenta({
    user_id: req.usuario.id, // se toma del JWT, no del body
    metodo_pago,
    items,
  });
  res.status(201).json({ success: true, data: venta });
}

async function listar(req, res) {
  const { page, pageSize, desde, hasta } = req.query;
  const resultado = await ventaService.listar({ page, pageSize, desde, hasta });
  res.json({ success: true, ...resultado });
}

async function obtenerPorId(req, res) {
  const venta = await ventaService.obtenerPorId(req.params.id);
  res.json({ success: true, data: venta });
}

async function resumen(req, res) {
  const { desde, hasta } = req.query;
  const resultado = await ventaService.resumen({ desde, hasta });
  res.json({ success: true, data: resultado });
}

module.exports = { registrar, listar, obtenerPorId, resumen };
