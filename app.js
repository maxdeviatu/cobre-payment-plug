// app.js
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const logger = require('./config/logger');
const cobrePaymentRoutes = require('./routes/pagos/cobrePaymentRoutes');
const sequelize = require('./config/database');
const cobrePaymentService = require('./services/pagos/cobrePaymentService'); // Importar el servicio de webhook

dotenv.config();

const app = express();

// Configurar limitador global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // Limite cada IP a 100 solicitudes por ventanaMs
  message: {
    error: 'Demasiadas solicitudes desde esta IP, por favor intenta de nuevo más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Aplicar el limitador global a todas las rutas
app.use(globalLimiter);

// Confía en el proxy para obtener la IP real del cliente (si está detrás de un proxy)
app.set('trust proxy', 1);

// Middleware para parsear application/x-www-form-urlencoded
app.use(express.urlencoded({ extended: true }));

// Middleware para parsear JSON
app.use(express.json());

// Middleware para manejar CORS
const allowedOrigins = process.env.ALLOWED_ORIGIN
  ? process.env.ALLOWED_ORIGIN.split(',') // Asumiendo que ALLOWED_ORIGIN es una lista separada por comas
  : [];

app.use(cors({
  origin: function (origin, callback) {
    // Permitir solicitudes sin origen (por ejemplo, desde Postman)
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      // El origen está permitido
      return callback(null, true);
    } else {
      // El origen no está permitido
      return callback(new Error('Origen no permitido por CORS'));
    }
  },
  methods: 'GET, POST, PUT, DELETE, OPTIONS',
  allowedHeaders: 'Content-Type, Authorization'
}));

// Manejar solicitudes preflight
app.options('*', cors());

// Configurando rutas
logger.info('Configurando rutas de la aplicación');
app.use('/api/pagos/cobre', cobrePaymentRoutes);

// Ruta por defecto para verificar que el servidor está funcionando
app.get('/', (req, res) => {
  res.send('Cobre Payment Plug está funcionando correctamente.');
});

// Manejo de errores de CORS
app.use((err, req, res, next) => {
  if (err.message === 'Origen no permitido por CORS') {
    return res.status(403).json({ error: err.message });
  }
  next(err);
});

// Manejo de errores generales
app.use((err, req, res, next) => {
  logger.error('Error general en la aplicación', { message: err.message, stack: err.stack });
  res.status(500).json({ error: 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3000;

// Arranca el servidor
app.listen(PORT, () => {
  logger.info(`Servidor escuchando en el puerto ${PORT}`);
});

// Manejo de errores no capturados 
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason.message || reason,
    stack: reason.stack || 'No stack trace available'
  });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    message: error.message,
    stack: error.stack
  });
  process.exit(1);
});

// Registrar el webhook de Cobre después de sincronizar la base de datos
sequelize
  .authenticate()
  .then(async () => {
    logger.info('Conexión a PostgreSQL establecida correctamente.');
    await sequelize.sync(); // Sincroniza todos los modelos
    logger.info('Modelos sincronizados correctamente.');

    // Registrar el webhook de Cobre
    const webhookUrl = process.env.WEBHOOK_URL;
    const webhookSecret = process.env.WEBHOOK_SECRET;

    if (webhookUrl && webhookSecret) {
      try {
        await cobrePaymentService.registerWebhook(webhookUrl, webhookSecret);
        logger.info('Webhook de Cobre registrado exitosamente.');
      } catch (error) {
        logger.error('Error al registrar el webhook de Cobre:', { message: error.message });
        // Dependiendo de tus necesidades, podrías decidir si continuar o detener la aplicación
        // process.exit(1);
      }
    } else {
      logger.warn('WEBHOOK_URL o WEBHOOK_SECRET no está definido en .env. El webhook no se registrará.');
    }
  })
  .catch((error) => {
    logger.error('Error conectando a PostgreSQL:', { message: error.message });
    process.exit(1);
  });
