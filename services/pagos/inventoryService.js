// services/pagos/inventoryService.js
const Inventory = require('../../models/inventoryModel');
const logger = require('../../config/logger');

/**
 * Obtiene un producto disponible del inventario.
 * @param {string} productReference - Referencia del producto.
 * @param {number} expectedPrice - Precio esperado.
 * @returns {object|null} - El producto disponible o null.
 */
async function getAvailableProduct(productReference, expectedPrice) {
  try {
    const product = await Inventory.findOne({
      where: {
        status: 'DISPONIBLE',
        product_reference: productReference,
        priceAmount: expectedPrice
      }
    });
    if (!product) {
      logger.warn('Producto no disponible o el precio no coincide', { product_reference: productReference, expectedPrice });
    }
    return product;
  } catch (error) {
    logger.error('Error al obtener producto disponible:', { message: error.message });
    throw error;
  }
}

/**
 * Actualiza el estado de un producto en el inventario.
 * @param {number} productId - ID del producto.
 * @param {string} status - Nuevo estado.
 */
async function updateProductStatus(productId, status) {
  try {
    const product = await Inventory.findByPk(productId);
    if (!product) {
      throw new Error('No se encontró el producto para actualizar');
    }
    product.status = status;
    await product.save();
    logger.info('Estado del producto actualizado', { id: productId, status });
  } catch (error) {
    logger.error('Error al actualizar el estado del producto:', { message: error.message });
    throw error;
  }
}

module.exports = {
  getAvailableProduct,
  updateProductStatus,
};
