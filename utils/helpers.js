// utils/helpers.js
const logger = require('../config/logger');

/**
 * Codifica las credenciales en Base64.
 * @param {string} clientId - ID del cliente.
 * @param {string} clientSecret - Secreto del cliente.
 * @returns {string} - Credenciales codificadas.
 */
exports.encodeCredentials = (clientId, clientSecret) => {
  logger.debug('Iniciando codificación de credenciales en utils/helpers.js');

  const encodedCredentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  logger.debug('Credenciales codificadas correctamente, longitud:', encodedCredentials.length);

  return encodedCredentials;
};
