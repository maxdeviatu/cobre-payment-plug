// utils/cryptoUtils.js
const crypto = require('crypto');
const logger = require('../config/logger');

/**
 * Calcula el checksum SHA-256.
 * @param {string} noveltyUuid - UUID de la novedad.
 * @param {string} noveltyDetailUuid - UUID del detalle de la novedad.
 * @param {string} secret - Secreto para el cálculo.
 * @returns {string} - Checksum calculado.
 */
exports.calculateChecksum = (noveltyUuid, noveltyDetailUuid, secret) => {
  const data = `${noveltyUuid}_${noveltyDetailUuid}_${secret}`;
  const checksum = crypto.createHash('sha256').update(data).digest('hex');
  logger.debug('Checksum calculado:', checksum);
  return checksum;
};
