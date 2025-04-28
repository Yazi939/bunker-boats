const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Vehicle = require('./Vehicle');

const Shift = sequelize.define('Shift', {
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('active', 'completed', 'cancelled'),
    defaultValue: 'active'
  },
  startFuel: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Начальное количество топлива должно быть положительным числом' }
    }
  },
  endFuel: {
    type: DataTypes.FLOAT,
    allowNull: true,
    validate: {
      min: { args: [0], msg: 'Конечное количество топлива должно быть положительным числом' }
    }
  },
  distance: {
    type: DataTypes.FLOAT,
    allowNull: true,
    defaultValue: 0,
    validate: {
      min: { args: [0], msg: 'Расстояние должно быть положительным числом' }
    }
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

// Определяем связи
Shift.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Shift.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

module.exports = Shift; 