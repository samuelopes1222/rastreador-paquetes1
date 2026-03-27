const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Driver = sequelize.define('Driver', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  cedula: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
    validate: {
      notEmpty: {
        msg: 'La cédula no puede estar vacía',
      },
    },
  },
  phone: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true,
    validate: {
      isEmail: true,
    },
  },
  passwordHash: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  vehicle: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  plate: {
    type: DataTypes.STRING,
    allowNull: true,
    unique: true,
  },
  status: {
    type: DataTypes.ENUM('active', 'inactive', 'on-break'),
    defaultValue: 'active',
  },
  isTrackingEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  currentLat: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: true,
  },
  currentLng: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: true,
  },
  lastLocationUpdate: {
    type: DataTypes.DATE,
    allowNull: true,
  },
  activePackages: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  rating: {
    type: DataTypes.DECIMAL(3, 2),
    defaultValue: 5.0,
  },
  totalDeliveries: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
}, {
  timestamps: true,
  tableName: 'drivers',
});

module.exports = Driver;
