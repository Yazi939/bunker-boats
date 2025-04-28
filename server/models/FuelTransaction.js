const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const User = require('./User');
const Vehicle = require('./Vehicle');

const FuelTransaction = sequelize.define('FuelTransaction', {
  date: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  type: {
    type: DataTypes.ENUM('purchase', 'sale', 'drain', 'base_to_bunker', 'bunker_to_base'),
    allowNull: false
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Количество топлива должно быть положительным числом' }
    }
  },
  price: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Цена топлива должна быть положительным числом' }
    }
  },
  totalCost: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Общая стоимость должна быть положительным числом' }
    }
  },
  fuelType: {
    type: DataTypes.ENUM('diesel', 'gasoline', 'gasoline_95', 'gasoline_92'),
    defaultValue: 'diesel'
  },
  source: {
    type: DataTypes.STRING,
    allowNull: true
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  timestamps: true
});

// Определяем связи
FuelTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
FuelTransaction.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

module.exports = FuelTransaction; 