// services/pagos/cobrePaymentService.js
const axios = require('axios');
const { v4: uuidv4 } = require('uuid');
const logger = require('../../config/logger');
const dotenv = require('dotenv');
const { encodeCredentials } = require('../../utils/helpers');

dotenv.config();

const {
  COBRE_API_KEY: API_KEY,
  CLIENT_ID,
  CLIENT_SECRET,
  COBRE_URL_TOKENS: urlTokens,
  COBRE_URL_PAYMENTS: urlPayments,
  COBRE_URL_REGISTER_WEBHOOK: urlRegisterWebhook,
  COBRE_URL_PAYMENT_LINK_INFO: urlPaymentLinkInfo,
  REDIRECT_URL,
  WEBHOOK_URL, // Añadido para usar directamente si es necesario
  WEBHOOK_SECRET // Añadido para usar directamente si es necesario
} = process.env;

const getHeaders = (token = null) => ({
  "X-API-KEY": API_KEY,
  ...(token && { "X-APIGW-AUTH": `Bearer ${token}` }),
  "X-CORRELATION-ID": uuidv4(),
  "Content-Type": "application/json",
  "Accept": "application/json"
});

/**
 * Obtiene un token de acceso de Cobre.
 * @returns {string} - Token de acceso.
 */
exports.getAccessToken = async () => {
  logger.debug('Obteniendo token de acceso de Cobre');

  const payload = new URLSearchParams({ grant_type: "client_credentials" });
  const headers = {
    "X-API-KEY": API_KEY,
    "Authorization": `Basic ${encodeCredentials(CLIENT_ID, CLIENT_SECRET)}`,
    "Content-Type": "application/x-www-form-urlencoded",
    "Accept": "application/json"
  };

  try {
    const response = await axios.post(urlTokens, payload.toString(), { headers });
    if (response.status !== 200) {
      logger.warn('Error al obtener token. Status:', response.status);
      throw new Error("No se pudo generar token de acceso");
    }
    logger.debug('Token de acceso obtenido exitosamente');
    return response.data.access_token;
  } catch (error) {
    logger.error("Error obteniendo el token de acceso de Cobre:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

/**
 * Crea un pago en Cobre.
 * @param {string} token - Token de acceso.
 * @param {object} paymentData - Datos del pago.
 * @returns {object} - Respuesta de la API de Cobre.
 */
exports.createPayment = async (token, paymentData) => {
  logger.debug('Creando pago en Cobre');

  const uniqueReference = uuidv4();
  const payload = {
    ...paymentData,
    customProductReference: paymentData.product_reference,
    references: [uniqueReference],
    currency: "COP",
    redirectUrl: REDIRECT_URL
  };
  const headers = getHeaders(token);

  // Agregar logs detallados sobre el payload y headers
  logger.debug('Datos de pago (payload):', JSON.stringify(payload, null, 2));
  logger.debug('Headers usados para la solicitud:', JSON.stringify(headers, null, 2));

  try {
    const response = await axios.post(urlPayments, payload, { headers });
    logger.debug('Respuesta recibida:', response.data);
    logger.info("Enlace de pago creado exitosamente 💲", {
      linkUrl: response.data.linkUrl,
      paymentReference: response.data.cashInNoveltyDetailUuid, // Actualizado a paymentReference
      notificationMethodsResult: response.data.notificationMethodsResult
    });
    return response.data;
  } catch (error) {
    // Agregar logs detallados sobre el error
    logger.error("Error creando el pago en Cobre:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

/**
 * Obtiene información sobre un enlace de pago.
 * @param {string} token - Token de acceso.
 * @param {string} paymentReference - Referencia de pago.
 * @returns {object} - Información del enlace de pago.
 */
exports.getPaymentLinkInfo = async (token, paymentReference) => {
  logger.debug('Obteniendo información del enlace de pago en Cobre');

  const url = `${urlPaymentLinkInfo}/${paymentReference}`;
  const headers = getHeaders(token);

  try {
    const response = await axios.get(url, { headers });
    logger.debug('Información del enlace recibida:', response.data);
    return response.data;
  } catch (error) {
    logger.error("Error obteniendo la información del enlace de pago en Cobre:", {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};

/**
 * Registra un webhook en Cobre.
 * @param {string} endpointUrl - URL del endpoint del webhook.
 * @param {string} secret - Secreto del webhook.
 * @returns {object} - Respuesta de la API de Cobre.
 */
exports.registerWebhook = async (endpointUrl, secret) => {
  logger.debug('Registrando webhook en Cobre');

  const token = await exports.getAccessToken();
  const payload = {
    endpoint: endpointUrl,
    secret: secret,
    statuses: ['PAID', 'EXPIRED', 'REJECTED']
  };
  const headers = getHeaders(token);

  try {
    const response = await axios.post(urlRegisterWebhook, payload, { headers });
    logger.debug('Webhook registrado:', response.data);
    logger.info('Webhook de Cobre registrado correctamente', {
      endpointUrl,
      statuses: payload.statuses
    });
    return response.data;
  } catch (error) {
    logger.error('Error registrando el webhook en Cobre:', {
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    });
    throw error;
  }
};
