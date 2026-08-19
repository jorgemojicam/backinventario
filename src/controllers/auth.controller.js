const authService = require('../services/auth.service');
const ApiError = require('../utils/ApiError');

async function registrar(req, res) {
  const usuario = await authService.registrar(req.body);
  res.status(201).json({ success: true, data: usuario });
}

async function login(req, res) {
  const resultado = await authService.login(req.body);
  res.json({ success: true, data: resultado }); // { usuario, perfiles, token }
}

async function cambiarPassword(req, res) {
  const { usuarioId } = req.params;
  const esDueño = String(req.usuario.id) === String(usuarioId);
  const esAdmin = req.usuario.perfiles.includes('admin');

  if (!esDueño && !esAdmin) {
    throw new ApiError(403, 'Solo puedes cambiar tu propia contraseña');
  }

  await authService.cambiarPassword(usuarioId, req.body);
  res.json({ success: true, message: 'Contraseña actualizada correctamente' });
}

module.exports = { registrar, login, cambiarPassword };
