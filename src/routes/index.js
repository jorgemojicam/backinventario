const { Router } = require('express');
const usuarioRoutes = require('./usuario.routes');
const productoRoutes = require('./producto.routes');
const authRoutes = require('./auth.routes');
const perfilRoutes = require('./perfil.routes');
const ventaRoutes = require('./venta.routes');
const { autenticar } = require('../middlewares/auth.middleware');

const router = Router();

router.get('/health', (req, res) => {
  res.json({ success: true, message: 'API funcionando correctamente', timestamp: new Date().toISOString() });
});

// Público: registro y login no requieren token (obviamente, todavía no existe uno)
router.use('/auth', authRoutes);

// A partir de aquí, todo requiere Authorization: Bearer <token>
router.use('/usuarios', autenticar, usuarioRoutes);
router.use('/productos', autenticar, productoRoutes);
router.use('/perfiles', autenticar, perfilRoutes);
router.use('/ventas', autenticar, ventaRoutes);

module.exports = router;
