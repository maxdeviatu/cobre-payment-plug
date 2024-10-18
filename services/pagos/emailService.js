// services/pagos/emailService.js
require('dotenv').config();
const SibApiV3Sdk = require('@sendinblue/client');
const logger = require('../../config/logger');

const BREVO_API_KEY = process.env.BREVO_API_KEY;

// Configurar la API Key de Sendinblue
const brevoClient = new SibApiV3Sdk.TransactionalEmailsApi();
brevoClient.setApiKey(SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey, BREVO_API_KEY);

const whatsappLink = 'https://wa.link/b6dl4y';

/**
 * Envía un correo electrónico al usuario con la información del producto comprado.
 * @param {string} email - Email del usuario.
 * @param {string} productName - Nombre del producto.
 * @param {string} activationKey - Clave de activación.
 * @param {string} activationInstructions - Instrucciones de activación.
 * @param {string|null} sellerMail - Email del vendedor (opcional).
 */
async function sendProductEmail(email, productName, activationKey, activationInstructions, sellerMail = null) {
  try {
    const senderEmail = 'administrativo@innovatelearning.com.co';
    const senderName = 'Innovate Learning';
    const supportEmail = sellerMail || 'administrativo@innovatelearning.com.co';

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.subject = `Tu producto ${productName} está listo`;
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <img src="https://cdn.prod.website-files.com/66d789e4de77bc0e046b9d8c/66f4728822277358ccdfcb3a_Delivery.webp" alt="Innovate Learning" style="width: 100%; height: auto;">
        <div style="padding: 20px;">
          <h1 style="color: #333;">Gracias por tu compra</h1>
          <p style="font-size: 16px; color: #555;">Producto: <strong>${productName}</strong></p>
          <p style="font-size: 16px; color: #555;">Clave de activación: <strong>${activationKey}</strong></p>
          <p style="font-size: 16px; color: #555;">Instrucciones: ${activationInstructions || 'No hay instrucciones de activación.'}</p>
        </div>
        <div style="background-color: #f7f7f7; padding: 10px; text-align: center; font-size: 14px; color: #777;">
          <p>En caso de dudas, quejas, peticiones o reclamos, puedes contactarnos a través de <a href="mailto:${supportEmail}">${supportEmail}</a>. | También puedes escribirnos por <a href="${whatsappLink}" target="_blank">WhatsApp</a>.</p>
        </div>
      </div>
    `;

    const response = await brevoClient.sendTransacEmail(sendSmtpEmail);
    logger.info(`Correo enviado a ${email} con éxito`, { messageId: response.messageId });
    return response;
  } catch (error) {
    logger.error('Error enviando correo de producto', { message: error.message });
    throw error;
  }
}

/**
 * Envía un correo electrónico al usuario indicando que está en una lista de espera.
 * @param {string} email - Email del usuario.
 */
async function sendWaitlistEmail(email) {
  try {
    const senderEmail = 'administrativo@innovatelearning.com.co';
    const senderName = 'Innovate Learning';
    const supportEmail = 'administrativo@innovatelearning.com.co'; // Correo de soporte predeterminado

    const sendSmtpEmail = new SibApiV3Sdk.SendSmtpEmail();

    sendSmtpEmail.sender = { name: senderName, email: senderEmail };
    sendSmtpEmail.to = [{ email: email }];
    sendSmtpEmail.subject = 'Estás en la lista de espera';
    sendSmtpEmail.htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <img src="https://cdn.prod.website-files.com/66d789e4de77bc0e046b9d8c/66f4728822277358ccdfcb3a_Delivery.webp" alt="Innovate Learning" style="width: 100%; height: auto;">
        <div style="padding: 20px;">
          <h1 style="color: #333;">Has sido agregado a nuestra lista de espera</h1>
          <p style="font-size: 16px; color: #555;">Actualmente no tenemos disponibilidad del producto, pero te hemos agregado a nuestra lista de espera.</p>
          <p style="font-size: 16px; color: #555;">Te notificaremos tan pronto como tengamos disponibilidad.</p>
        </div>
        <div style="background-color: #f7f7f7; padding: 10px; text-align: center; font-size: 14px; color: #777;">
          <p>En caso de dudas, quejas, peticiones o reclamos, puedes contactarnos a través de <a href="mailto:${supportEmail}">${supportEmail}</a>. | También puedes escribirnos por <a href="${whatsappLink}" target="_blank">WhatsApp</a>.</p>
        </div>
      </div>
    `;

    const response = await brevoClient.sendTransacEmail(sendSmtpEmail);
    logger.info(`Correo de lista de espera enviado a ${email} con éxito`, { messageId: response.messageId });
    return response;
  } catch (error) {
    logger.error('Error enviando correo de lista de espera', { message: error.message, email: email });
    throw error;
  }
}

module.exports = {
  sendProductEmail,
  sendWaitlistEmail,
};
