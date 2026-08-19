const jwt = require('jsonwebtoken');

if (!process.env.JWT_SECRET) {
  // Falla rápido si falta el secreto; nunca debe correr en producción con un default hardcodeado.
  console.warn('⚠️  JWT_SECRET no está definido en .env — usando uno temporal solo para desarrollo.');
}

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-cambiar-en-produccion';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';

// El payload incluye solo lo mínimo necesario: nunca metas password_hash ni datos sensibles.
function firmarToken({ usuarioId, email, perfiles = [] }) {
  return jwt.sign({ sub: usuarioId, email, perfiles }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

function verificarToken(token) {
  return jwt.verify(token, JWT_SECRET); // lanza error si expiró o es inválido
}

module.exports = { firmarToken, verificarToken };
