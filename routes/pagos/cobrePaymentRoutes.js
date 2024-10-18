// routes/pagos/cobrePaymentRoutes.js
const express = require('express');
const router = express.Router();
const cobrePaymentController = require('../../controllers/pagos/cobrePaymentController');
const rateLimit = require('express-rate-limit');
const logger = require('../../config/logger');

// Configurar el rate limiter específico para estas rutas
const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 20, // Máximo 20 solicitudes por IP en 15 minutos
  message: {
    error: 'Has excedido el número máximo de solicitudes. Intenta nuevamente más tarde.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

logger.info('Configurando rutas de pago de Cobre en cobrePaymentRoutes.js');

// Ruta para procesar pagos
router.post('/process-payment', paymentLimiter, cobrePaymentController.processPayment);

// Ruta para manejar la confirmación del webhook
router.post('/webhook', cobrePaymentController.handleWebhook);

module.exports = router;
