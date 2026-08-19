const { Router } = require('express');
const usuarioController = require('../controllers/usuario.controller');
const productoController = require('../controllers/producto.controller');
const perfilController = require('../controllers/perfil.controller');

const router = Router();

router.get('/', usuarioController.listar);
router.get('/:id', usuarioController.obtenerPorId);
// La creación de usuarios se hace vía POST /auth/registro (crea perfil + credenciales juntos).
router.put('/:id', usuarioController.actualizar);
router.delete('/:id', usuarioController.eliminar);

// Productos de un usuario específico
router.get('/:usuarioId/productos', productoController.listarPorUsuario);

// Perfiles (roles) asignados a un usuario
router.get('/:usuarioId/perfiles', perfilController.listarPerfilesDeUsuario);
router.post('/:usuarioId/perfiles', perfilController.asignarPerfil);
router.delete('/:usuarioId/perfiles/:perfilId', perfilController.quitarPerfil);

module.exports = router;
