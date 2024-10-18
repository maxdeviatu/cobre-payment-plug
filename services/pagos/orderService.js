// services/pagos/orderService.js
const Order = require('../../models/orderModel');
const logger = require('../../config/logger');

/**
 * Crea una nueva orden.
 * @param {object} orderData - Datos de la orden.
 * @returns {object} - La orden creada.
 */
async function createOrder(orderData) {
  try {
    const order = await Order.create(orderData);
    logger.info('Orden creada exitosamente', { id: order.id });
    return order;
  } catch (error) {
    logger.error('Error al crear la orden:', { message: error.message });
    throw error;
  }
}

module.exports = {
  createOrder,
};
