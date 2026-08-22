const { pool } = require('../config/db');
const movimientoRepository = require('../repositories/movimientoStock.repository');
const productoRepository = require('../repositories/producto.repository');
const ApiError = require('../utils/ApiError');

const TIPOS_VALIDOS = ['entrada', 'salida'];
const MOTIVOS_SUGERIDOS = ['compra', 'venta', 'ajuste', 'devolucion', 'merma'];

function validar({ tipo, cantidad, motivo }) {
  const errores = [];
  if (!TIPOS_VALIDOS.includes(tipo)) errores.push(`tipo debe ser: ${TIPOS_VALIDOS.join(' | ')}`);
  if (!Number.isInteger(Number(cantidad)) || Number(cantidad) <= 0)
    errores.push('cantidad debe ser un entero mayor a 0');
  if (!motivo || motivo.trim().length < 2) errores.push('motivo es obligatorio');

  if (errores.length > 0) throw ApiError.badRequest('Datos inválidos', errores);
}

// Registra un movimiento (entrada/salida) y actualiza productos.stock en una sola transacción.
async function registrar({ product_id, tipo, cantidad, motivo, usuario_id, nota }) {
  validar({ tipo, cantidad, motivo });
  const producto = await productoRepository.findById(product_id);    
  if (!producto) throw ApiError.notFound('Producto no encontrado');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
 
    const resultado = await movimientoRepository.registrarMovimiento(connection, {
      product_id,
      tipo,
      cantidad: Number(cantidad),
      motivo: motivo.trim(),
      usuario_id,
      nota,
    });

    await connection.commit();
    return resultado;
  } catch (error) {
    await connection.rollback();
    // Traduce los errores "manuales" lanzados por el repositorio a ApiError
    if (error.statusCode) throw new ApiError(error.statusCode, error.message);
    throw error;
  } finally {
    connection.release();
  }
}

async function historial(productoId, { page = 1, pageSize = 20 } = {}) {
  const producto = await productoRepository.findById(productoId);
  if (!producto) throw ApiError.notFound('Producto no encontrado');

  const limit = Math.min(Number(pageSize) || 20, 100);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [data, total] = await Promise.all([
    movimientoRepository.findByProductoId(productoId, { limit, offset }),
    movimientoRepository.countByProductoId(productoId),
  ]);

  return {
    data,
    pagination: { page: Number(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function verificarIntegridad(productoId) {
  const producto = await productoRepository.findById(productoId);
  if (!producto) throw ApiError.notFound('Producto no encontrado');

  const stockCalculado = await movimientoRepository.recalcularStock(productoId);
  return {
    stock_actual: producto.stock,
    stock_calculado_desde_movimientos: stockCalculado,
    consistente: Number(producto.stock) === Number(stockCalculado),
  };
}

module.exports = { registrar, historial, verificarIntegridad, MOTIVOS_SUGERIDOS };
