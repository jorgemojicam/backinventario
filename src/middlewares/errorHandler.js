const ApiError = require('../utils/ApiError');

// Middleware 404: cuando ninguna ruta coincide.
function notFoundHandler(req, res, next) {
  next(ApiError.notFound(`Ruta no encontrada: ${req.method} ${req.originalUrl}`));
}

// Middleware centralizado de errores. Debe ir SIEMPRE al final de la cadena de middlewares.
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let { statusCode, message, details } = err;

  // Errores conocidos de mysql2 que conviene traducir a algo entendible
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'El registro ya existe (violación de restricción única)';
  } else if (err.code === 'ER_NO_REFERENCED_ROW_2' || err.code === 'ER_ROW_IS_REFERENCED_2') {
    statusCode = 409;
    message = 'La operación viola una relación de llave foránea';
  }

  if (!statusCode) statusCode = 500;
  if (!message) message = 'Error interno del servidor';

  if (statusCode === 500) {
    console.error('🔥 Error no controlado:', err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
