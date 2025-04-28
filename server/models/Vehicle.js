const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Vehicle = sequelize.define('Vehicle', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      notEmpty: { msg: 'Пожалуйста, укажите название транспортного средства' }
    }
  },
  type: {
    type: DataTypes.ENUM('boat', 'car', 'truck', 'other'),
    defaultValue: 'boat'
  },
  registrationNumber: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: { msg: 'Пожалуйста, укажите регистрационный номер' }
    }
  },
  fuelCapacity: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Объем топливного бака должен быть положительным числом' }
    }
  },
  fuelConsumption: {
    type: DataTypes.FLOAT,
    allowNull: false,
    validate: {
      min: { args: [0], msg: 'Расход топлива должен быть положительным числом' }
    }
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  }
}, {
  timestamps: true
});

module.exports = Vehicle; 