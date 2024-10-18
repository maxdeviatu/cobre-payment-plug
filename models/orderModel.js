// models/orderModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Order = sequelize.define('Order', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  productInventoryId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Inventories',
      key: 'id'
    }
  },
  emailToSend: {
    type: DataTypes.STRING,
    allowNull: false
  },
  transactionId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Transactions',
      key: 'id'
    }
  }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Order;
