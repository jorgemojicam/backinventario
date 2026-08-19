const productoRepository = require("../repositories/producto.repository");
const usuarioRepository = require("../repositories/usuario.repository");
const ApiError = require("../utils/ApiError");

async function listar({ page = 1, pageSize = 20, search = "" } = {}) {
  const limit = Math.min(Number(pageSize) || 20, 100);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;
  const searchTrim = (search || "").trim();

  const [data, total] = await Promise.all([
    productoRepository.findAll({ limit, offset, search: searchTrim }),
    productoRepository.count({ search: searchTrim }),
  ]);

  return {
    data,
    pagination: {
      page: Number(page),
      pageSize: limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

async function obtenerPorId(id) {
  const producto = await productoRepository.findById(id);
  if (!producto) throw ApiError.notFound("Producto no encontrado");
  return producto;
}

function validarDatos({ name, price }) {
  const errores = [];
  if (!name || name.trim().length < 2)
    errores.push("El name debe tener al menos 2 caracteres");
  if (price === undefined || isNaN(price) || Number(price) < 0)
    errores.push("El price debe ser un número mayor o igual a 0");

  if (errores.length > 0) throw ApiError.badRequest("Datos inválidos", errores);
}

// El stock inicial solo se acepta al crear el producto (arranca en 0 o el valor dado).
// A partir de ahí, todo cambio de stock debe pasar por /productos/:id/movimientos
// para quedar registrado en el ledger (movimientos_stock).
async function crear(datos) {
  validarDatos(datos);

  if (datos.user_id) {
    const usuario = await usuarioRepository.findById(datos.user_id);
    if (!usuario) throw ApiError.badRequest("El user_id indicado no existe");
  }

  const stockInicial = datos.stock !== undefined ? Number(datos.stock) : 0;
  if (isNaN(stockInicial) || stockInicial < 0) {
    throw ApiError.badRequest(
      "El stock inicial debe ser un número mayor o igual a 0",
    );
  }

  return productoRepository.create({
    name: datos.name,
    description: datos.description || null,
    price: datos.price,
    stock: stockInicial,
    user_id: datos.user_id || null,
  });
}

// Actualiza solo datos descriptivos (name, descripción, price). NO acepta `stock`:
// para eso existe POST /productos/:id/movimientos, que deja registro en el ledger.
async function actualizar(id, datos) {
  await obtenerPorId(id); // valida existencia
  validarDatos(datos);
  const { name, description, price } = datos;
  return productoRepository.update(id, { name, description, price });
}

async function eliminar(id) {
  await obtenerPorId(id); // valida existencia
  return productoRepository.remove(id);
}

async function listarPorUsuario(usuarioId) {
  const usuario = await usuarioRepository.findById(usuarioId);
  if (!usuario) throw ApiError.notFound("Usuario no encontrado");
  return productoRepository.findByUsuarioId(usuarioId);
}

module.exports = {
  listar,
  obtenerPorId,
  crear,
  actualizar,
  eliminar,
  listarPorUsuario,
};
