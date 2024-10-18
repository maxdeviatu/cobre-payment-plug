// config/database.js
const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
const logger = require('./logger');

dotenv.config();

const { DB_NAME, DB_USER, DB_PASSWORD, DB_HOST, DB_PORT } = process.env;

// Verificar si todas las variables para la db estan precentes antes de arrancar el app
if (!DB_NAME || !DB_USER || !DB_PASSWORD || !DB_HOST || !DB_PORT) {
  logger.error('Faltan una o más variables de entorno para la conexión a la base de datos');
  process.exit(1);
}

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'postgres',
  logging: (msg) => logger.debug(`[sequelize]: ${msg}`), // Hacer un log de todos los mensajes de la db
  dialectOptions: {
    // Se puede personalizar el dialecto aqui
  },
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000,
  },
});

sequelize
  .authenticate()
  .then(async () => {
    logger.info('Conexión a PostgreSQL establecida correctamente.');
    await sequelize.sync(); // Hacer la sincronizacion de todos los metodos
    logger.info('Modelos sincronizados correctamente.');
  })
  .catch((error) => {
    logger.error('Error conectando a PostgreSQL:', { message: error.message });
    process.exit(1);
  });

module.exports = sequelize;
