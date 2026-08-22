const { pool } = require('../config/db');
const ventaRepository = require('../repositories/venta.repository');
const movimientoRepository = require('../repositories/movimientoStock.repository');
const ApiError = require('../utils/ApiError');

const METODOS_VALIDOS = ['efectivo', 'tarjeta', 'transferencia', 'otro'];

function validarItems(items) {
  if (!Array.isArray(items) || items.length === 0) {
    throw ApiError.badRequest('La venta debe incluir al menos un product');
  }

  for (const item of items) {
    if (!item.product_id || !Number.isInteger(Number(item.cantidad)) || Number(item.cantidad) <= 0) {
      throw ApiError.badRequest('Cada ítem requiere product_id y una cantidad entera mayor a 0');
    }
  }
}

// Registra una venta completa en una sola transacción:
//  1. Bloquea (FOR UPDATE) y valida cada product involucrado.
//  2. Calcula subtotales con el precio ACTUAL del product (se guarda como snapshot).
//  3. Crea la cabecera de venta con el total.
//  4. Por cada ítem: descuenta stock vía el ledger de movimientos (motivo='venta') e inserta la línea de detalle.
// Si cualquier paso falla (ej. stock insuficiente), se revierte todo — nunca queda una venta a medias.
async function registrarVenta({ user_id, metodo_pago = 'efectivo', items }) {
  validarItems(items);

  if (!METODOS_VALIDOS.includes(metodo_pago)) {
    throw ApiError.badRequest(`metodo_pago debe ser: ${METODOS_VALIDOS.join(' | ')}`);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Paso 1 y 2: bloquear products, leer precio actual, calcular subtotales
    const lineas = [];
    let total = 0;

    for (const item of items) {
      const [rows] = await connection.query(
        'SELECT id, name, price FROM product WHERE id = ? FOR UPDATE',
        [item.product_id]
      );
      const product = rows[0];
      if (!product) {
        throw new ApiError(404, `product ${item.product_id} no encontrado`);
      }

      const cantidad = Number(item.cantidad);
      const precioUnitario = Number(product.price);
      const subtotal = Number((precioUnitario * cantidad).toFixed(2));

      lineas.push({ product_id: product.id, name: product.name, cantidad, precioUnitario, subtotal });
      total += subtotal;
    }

    total = Number(total.toFixed(2));

    // Paso 3: cabecera de venta
    const ventaId = await ventaRepository.crearVenta(connection, { user_id, metodo_pago, total });

    // Paso 4: por cada línea, descontar stock (lanza 409 si no alcanza) e insertar detalle
    for (const linea of lineas) {
      await movimientoRepository.registrarMovimiento(connection, {
        product_id: linea.product_id,
        tipo: 'salida',
        cantidad: linea.cantidad,
        motivo: 'venta',
        user_id,
        nota: `Venta #${ventaId}`,
      });

      await ventaRepository.agregarDetalle(connection, {
        venta_id: ventaId,
        product_id: linea.product_id,
        cantidad: linea.cantidad,
        precio_unitario: linea.precioUnitario,
        subtotal: linea.subtotal,
      });
    }

    await connection.commit();
    return ventaRepository.findById(ventaId);
  } catch (error) {
    await connection.rollback();
    if (error.statusCode) throw new ApiError(error.statusCode, error.message);
    throw error;
  } finally {
    connection.release();
  }
}

async function listar({ page = 1, pageSize = 20, desde, hasta } = {}) {
  const limit = Math.min(Number(pageSize) || 20, 100);
  const offset = (Math.max(Number(page) || 1, 1) - 1) * limit;

  const [data, total] = await Promise.all([
    ventaRepository.findAll({ limit, offset, desde, hasta }),
    ventaRepository.count({ desde, hasta }),
  ]);

  return {
    data,
    pagination: { page: Number(page), pageSize: limit, total, totalPages: Math.ceil(total / limit) },
  };
}

async function obtenerPorId(id) {
  const venta = await ventaRepository.findById(id);
  if (!venta) throw ApiError.notFound('Venta no encontrada');
  return venta;
}

// Resumen de ingresos para el panel del POS: útil para mostrar "ventas de hoy".
async function resumen({ desde, hasta } = {}) {
  return ventaRepository.sumaIngresos({ desde, hasta });
}

module.exports = { registrarVenta, listar, obtenerPorId, resumen };
