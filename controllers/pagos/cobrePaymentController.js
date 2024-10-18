// controllers/pagos/cobrePaymentController.js
const cobrePaymentService = require('../../services/pagos/cobrePaymentService');
const logger = require('../../config/logger');
const Transaction = require('../../models/transactionModel');
const Inventory = require('../../models/inventoryModel');
const Order = require('../../models/orderModel');
const { calculateChecksum } = require('../../utils/cryptoUtils');
const emailService = require('../../services/pagos/emailService');
const { getAvailableProduct, updateProductStatus } = require('../../services/pagos/inventoryService');
const { createOrder } = require('../../services/pagos/orderService');

/**
 * Procesa un nuevo pago con Cobre.
 * @param {object} req - Objeto de solicitud Express.
 * @param {object} res - Objeto de respuesta Express.
 */
exports.processPayment = async (req, res) => {
  logger.info('Iniciando proceso de pago con Cobre');

  try {
    const paymentData = req.body;

    // Validar datos requeridos
    const requiredFields = ['product_reference', 'amount', 'email', 'fullName'];
    const missingFields = requiredFields.filter(field => !paymentData[field]);
    if (missingFields.length > 0) {
      throw new Error(`Faltan datos requeridos: ${missingFields.join(', ')}`);
    }

    // Verificar que amount es un número válido
    if (isNaN(paymentData.amount) || Number(paymentData.amount) <= 0) {
      throw new Error('El campo amount debe ser un número positivo válido');
    }

    logger.debug('Datos de pago recibidos:', paymentData);

    // Obtener token de acceso
    const token = await cobrePaymentService.getAccessToken();

    // Crear el pago en Cobre
    const paymentResponse = await cobrePaymentService.createPayment(token, paymentData);
    logger.debug('Respuesta recibida del pago en Cobre:', paymentResponse);

    // Registrar la transacción en la base de datos
    const transaction = await Transaction.create({
      paymentReference: paymentResponse.cashInNoveltyDetailUuid,
      status: 'PENDING',
      fullName: paymentData.fullName,
      email: paymentData.email,
      cellPhone: paymentData.cellPhone,
      document: paymentData.document,
      documentType: paymentData.documentType,
      description: paymentData.description,
      currency: paymentData.currency || 'COP',
      product_reference: paymentData.product_reference,
      paymentMethod: 'cobre', // Especificar el método de pago
      amount: paymentData.amount, // Agregado el campo amount
    });

    logger.info('Pago creado en Cobre exitosamente', {
      linkUrl: paymentResponse.linkUrl,
      paymentReference: paymentResponse.cashInNoveltyDetailUuid
    });

    res.status(200).json({
      message: 'Pago iniciado exitosamente',
      linkUrl: paymentResponse.linkUrl,
      paymentReference: paymentResponse.cashInNoveltyDetailUuid
    });
  } catch (error) {
    logger.error('Error procesando el pago con Cobre', { message: error.message, stack: error.stack });
    res.status(500).json({ error: 'Error procesando el pago' });
  }
};

/**
 * Maneja la confirmación del webhook de Cobre.
 * @param {object} req - Objeto de solicitud Express.
 * @param {object} res - Objeto de respuesta Express.
 */
exports.handleWebhook = async (req, res) => {
  logger.info('Recibiendo confirmación de Cobre');
  logger.debug('Datos de confirmación recibidos', req.body);

  try {
    const confirmationData = req.body;

    const { noveltyUuid, noveltyDetailUuid, transactionResult, checksum } = confirmationData;

    // Verificar la firma (Checksum)
    const calculatedChecksum = calculateChecksum(noveltyUuid, noveltyDetailUuid, process.env.WEBHOOK_SECRET);
    logger.debug(`Checksum recibido: ${checksum}`);
    logger.debug(`Checksum calculado: ${calculatedChecksum}`);

    if (calculatedChecksum !== checksum) {
      logger.error('Checksum inválido en confirmación de Cobre', {
        receivedChecksum: checksum,
        calculatedChecksum
      });
      return res.status(400).send('Checksum inválido');
    }

    // Determinar el nuevo estado de la transacción
    const status = (transactionResult === 'PAID') ? 'COMPLETED' : 'FAILED';
    logger.info(`Resultado de la transacción: ${status}`);

    // Actualizar el estado de la transacción
    const transaction = await Transaction.findOne({
      where: { paymentReference: noveltyDetailUuid },
    });

    if (!transaction) {
      logger.error('Transacción no encontrada para procesar la orden', { noveltyDetailUuid });
      throw new Error('Transacción no encontrada para procesar la orden');
    }

    transaction.status = status;
    await transaction.save();
    logger.info(`Estado de la transacción actualizado a ${status}`, { paymentReference: noveltyDetailUuid });

    // Si la transacción fue completada, manejar la lógica adicional
    if (status === 'COMPLETED') {
      logger.info('Transacción completada. Ejecutando lógica adicional.');

      // Verificar si el producto está disponible
      const product = await getAvailableProduct(transaction.product_reference, parseFloat(transaction.amount));
      logger.debug('Resultado de la búsqueda de producto:', product);

      if (product) {
        logger.info(`Producto encontrado: ${product.name} (ID: ${product.id})`);
        // Crear una orden
        const order = await createOrder({
          productInventoryId: product.id,
          emailToSend: transaction.email,
          transactionId: transaction.id,
        });
        logger.info('Orden creada exitosamente', { orderId: order.id });

        // Actualizar el estado del producto a 'VENDIDO'
        await updateProductStatus(product.id, 'VENDIDO');
        logger.info(`Estado del producto actualizado a 'VENDIDO' (ID: ${product.id})`);

        // Enviar correo de confirmación al usuario
        await emailService.sendProductEmail(
          transaction.email,
          product.name,
          product.activationKey,
          product.activationInstructions,
          product.sellerMail
        );
        logger.info('Correo de confirmación de producto enviado al usuario', { email: transaction.email });
      } else {
        logger.warn('Producto no disponible o el precio no coincide. Enviando correo de lista de espera.');

        // Enviar correo de lista de espera al usuario
        await emailService.sendWaitlistEmail(transaction.email);
        logger.info('Correo de lista de espera enviado al usuario', { email: transaction.email });
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error manejando confirmación de Cobre', { message: error.message, stack: error.stack });
    res.status(500).send('Error');
  }
};
