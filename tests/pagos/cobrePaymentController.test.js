// tests/pagos/cobrePaymentController.test.js
const request = require('supertest');
const express = require('express');
const cobrePaymentRoutes = require('../../routes/pagos/cobrePaymentRoutes');
const sequelize = require('../../config/database');
const Transaction = require('../../models/transactionModel');
const Inventory = require('../../models/inventoryModel');
const Order = require('../../models/orderModel');

const app = express();
app.use(express.json());
app.use('/api/pagos/cobre', cobrePaymentRoutes);

beforeAll(async () => {
  await sequelize.sync({ force: true });

  // Crear un producto en el inventario para pruebas
  await Inventory.create({
    product_reference: 'REF123',
    name: 'Producto de Prueba',
    activationKey: 'ABC123',
    activationInstructions: 'Instrucciones de activación.',
    priceAmount: 100000,
    status: 'DISPONIBLE',
    sellerMail: 'vendedor@example.com'
  });
});

afterAll(async () => {
  await sequelize.close();
});

describe('POST /api/pagos/cobre/process-payment', () => {
  it('Debería iniciar un pago exitosamente', async () => {
    const paymentData = {
      product_reference: 'REF123',
      amount: 100000,
      email: 'cliente@example.com',
      fullName: 'Juan Pérez',
      cellPhone: '+573001234567',
      document: '123456789',
      documentType: 'CC',
      description: 'Compra de producto X',
      currency: 'COP'
    };

    const response = await request(app)
      .post('/api/pagos/cobre/process-payment')
      .send(paymentData)
      .expect(200);

    expect(response.body).toHaveProperty('message', 'Pago iniciado exitosamente');
    expect(response.body).toHaveProperty('linkUrl');
    expect(response.body).toHaveProperty('paymentReference');
  });

  it('Debería fallar si faltan datos requeridos', async () => {
    const paymentData = {
      product_reference: 'REF123',
      amount: 100000,
      email: 'cliente@example.com',
      // Falta 'fullName'
    };

    const response = await request(app)
      .post('/api/pagos/cobre/process-payment')
      .send(paymentData)
      .expect(500);

    expect(response.body).toHaveProperty('error', 'Error procesando el pago');
  });
});
