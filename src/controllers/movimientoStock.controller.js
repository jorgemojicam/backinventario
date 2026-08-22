const movimientoService = require('../services/movimientoStock.service');

async function registrar(req, res) {
  const { productoId } = req.params;
  const { tipo, cantidad, motivo, nota } = req.body; // se ignora cualquier usuario_id que venga en el body

  const resultado = await movimientoService.registrar({
    product_id: productoId,
    tipo,
    cantidad,
    motivo,
    nota,
    user_id: req.usuario.id, // viene del JWT, puesto por el middleware `autenticar`
  });
  res.status(201).json({ success: true, data: resultado });
}

async function historial(req, res) {
  const { page, pageSize } = req.query;
  const resultado = await movimientoService.historial(req.params.productoId, { page, pageSize });
  res.json({ success: true, ...resultado });
}

async function verificarIntegridad(req, res) {
  const resultado = await movimientoService.verificarIntegridad(req.params.productoId);
  res.json({ success: true, data: resultado });
}

module.exports = { registrar, historial, verificarIntegridad };
