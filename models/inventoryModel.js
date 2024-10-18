// models/inventoryModel.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Inventory = sequelize.define('Inventory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  product_reference: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  activationKey: {
    type: DataTypes.STRING,
    allowNull: true
  },
  activationInstructions: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  priceAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('DISPONIBLE', 'VENDIDO'),
    allowNull: false,
    defaultValue: 'DISPONIBLE'
  },
  sellerMail: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: true,
  createdAt: 'createdAt',
  updatedAt: 'updatedAt'
});

module.exports = Inventory;
