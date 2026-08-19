const { Router } = require('express');
const perfilController = require('../controllers/perfil.controller');

const router = Router();

router.get('/', perfilController.listar);
router.get('/:id', perfilController.obtenerPorId);
router.post('/', perfilController.crear);

module.exports = router;
