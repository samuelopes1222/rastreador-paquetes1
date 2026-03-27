const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Package = sequelize.define('Package', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  code: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  sender: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  senderPhone: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  recipient: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  recipientPhone: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  address: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  lat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  lng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  originAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  originLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  originLng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  destinationAddress: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  destinationLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  destinationLng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-transit', 'out-for-delivery', 'delivered', 'failed'),
    defaultValue: 'pending',
  },
  weight: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deliveryPreference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  driverId: {
    type: DataTypes.UUID,
    allowNull: true,
  },
  rating: {
    type: DataTypes.INTEGER,
    allowNull: true,
  },
  feedback: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  deliveredAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  // Campos de pago
  paymentMethod: {
    type: DataTypes.ENUM('transfer', 'cash_on_delivery', 'prepaid'),
    defaultValue: 'transfer',
    allowNull: false,
  },
  paymentStatus: {
    type: DataTypes.ENUM('pending', 'confirmed', 'failed'),
    defaultValue: 'pending',
    allowNull: false,
  },
  transferAmount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: true,
  },
  transferReference: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  transferDate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  timestamps: true,
  tableName: 'packages',
});

module.exports = Package;
