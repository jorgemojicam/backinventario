const { Router } = require('express');
const ventaController = require('../controllers/venta.controller');

const router = Router();

router.get('/resumen', ventaController.resumen); // antes de /:id para que no choque con la ruta dinámica
router.get('/', ventaController.listar);
router.get('/:id', ventaController.obtenerPorId);
router.post('/', ventaController.registrar);

module.exports = router;
