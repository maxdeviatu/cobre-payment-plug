// config/logger.js
const winston = require('winston');
const path = require('path');

// Determinar si estamos en producción
const isProduction = process.env.NODE_ENV === 'production';
const showExtraLogs = process.env.SHOW_EXTRA_LOGS === 'true';

// Función para obtener información del llamador
function getCallerInfo() {
  const stack = new Error().stack.split('\n');
  const callerLine = stack[3]; // Ajustar el índice si es necesario
  const match = callerLine.match(/\((.*):\d+:\d+\)/);
  return match ? path.basename(match[1]) : 'unknown';
}

const logger = winston.createLogger({
  level: isProduction ? 'info' : 'debug', // Nivel de log según el entorno
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message, ...metadata }) => {
      let msg = `${timestamp} [${level}]: ${message}`;
      
      // Incluir metadatos solo si no es producción
      if (!isProduction && Object.keys(metadata).length) {
        msg += '\nMetadata:\n' + JSON.stringify(metadata, null, 2);
      }
      
      // Incluir stack trace si existe
      if (metadata.trace) {
        msg += `\nStack Trace:\n${metadata.trace}`;
      }
      
      return msg;
    })
  ),
  defaultMeta: { service: 'cobre-payment-plug' },
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Sobrescribir métodos de logging
['debug', 'info', 'warn', 'error'].forEach((level) => {
  const originalMethod = logger[level];
  logger[level] = function (message, meta = {}) {
    const callerInfo = getCallerInfo();
    let logMeta = { caller: callerInfo };

    if (level === 'error') {
      logMeta.trace = new Error().stack;
    }

    // Añadir separadores solo si no es producción y el nivel es debug o info
    if (!isProduction && (level === 'debug' || level === 'info')) {
      message = `\n${message}\n${'-'.repeat(50)}`; // Separador para evitar confusiones en los logs
    }

    // Registrar el mensaje con winston
    originalMethod.call(this, `[${callerInfo}] ${message}`, { ...logMeta, ...meta });

    // Solo mensajes adicionales si SHOW_EXTRA_LOGS está habilitado
    if (showExtraLogs) {
      console.log(`Ejecutando ${level} en ${callerInfo}: ${message}`);
    }
  };
});

// Agregar trace para depuración avanzada
logger.trace = function (message, meta = {}) {
  const callerInfo = getCallerInfo();
  const trace = new Error().stack;
  this.debug(`[TRACE] [${callerInfo}] ${message}`, { trace, ...meta });
};

module.exports = logger;
