const { Router } = require('express');
const productoController = require('../controllers/producto.controller');
const movimientoController = require('../controllers/movimientoStock.controller');

const router = Router();

router.get('/', productoController.listar);
router.get('/:id', productoController.obtenerPorId);
router.post('/', productoController.crear);
router.put('/:id', productoController.actualizar);
router.delete('/:id', productoController.eliminar);

// Movimientos de stock (entradas/salidas) de un producto
router.get('/:productoId/movimientos', movimientoController.historial);
router.post('/:productoId/movimientos', movimientoController.registrar);
router.get('/:productoId/movimientos/verificar', movimientoController.verificarIntegridad);

module.exports = router;
