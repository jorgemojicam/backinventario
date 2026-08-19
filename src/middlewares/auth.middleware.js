const { verificarToken } = require('../utils/jwt');
const ApiError = require('../utils/ApiError');

// Verifica el header Authorization: Bearer <token>. Si es válido, adjunta req.usuario.
function autenticar(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith('Bearer ')) {
    throw new ApiError(401, 'Token no proporcionado');
  }

  const token = header.slice('Bearer '.length).trim();

  try {
    const payload = verificarToken(token);
    req.usuario = { id: payload.sub, email: payload.email, perfiles: payload.perfiles || [] };
    next();
  } catch (error) {
    const msg = error.name === 'TokenExpiredError' ? 'Token expirado' : 'Token inválido';
    const apiError = new ApiError(401, msg);
    next(apiError);
  }
}

// Middleware de autorización: exige que el usuario autenticado tenga alguno de los perfiles dados.
// Uso: router.post('/', autenticar, autorizar('admin'), controller.crear)
function autorizar(...perfilesPermitidos) {
  return (req, res, next) => {
    const tienePermiso = req.usuario?.perfiles?.some((p) => perfilesPermitidos.includes(p));
    if (!tienePermiso) {
      return next(new ApiError(403, 'No tienes permisos para realizar esta acción'));
    }
    next();
  };
}

module.exports = { autenticar, autorizar };
