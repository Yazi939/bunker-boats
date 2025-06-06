const { sequelize } = require('../config/db');
const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// Определяем модели
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    },
    role: {
        type: DataTypes.ENUM('admin', 'user'),
        defaultValue: 'user'
    },
    lastSync: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
}, {
    hooks: {
        beforeCreate: async (user) => {
            if (user.password) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        },
        beforeUpdate: async (user) => {
            if (user.changed('password')) {
                const salt = await bcrypt.genSalt(10);
                user.password = await bcrypt.hash(user.password, salt);
            }
        }
    }
});

// Add instance method for password comparison
User.prototype.matchPassword = async function(enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

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
});

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
});

const FuelTransaction = sequelize.define('FuelTransaction', {
    date: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: DataTypes.NOW
    },
    type: {
        type: DataTypes.ENUM('purchase', 'sale', 'drain', 'base_to_bunker', 'bunker_to_base'),
        allowNull: false
    },
    amount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        validate: {
            min: { args: [0], msg: 'Количество топлива должно быть положительным числом' }
        }
    },
    price: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Цена топлива должна быть положительным числом' }
        }
    },
    totalCost: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Общая стоимость должна быть положительным числом' }
        }
    },
    fuelType: {
        type: DataTypes.ENUM('diesel', 'gasoline', 'gasoline_95', 'gasoline_92'),
        defaultValue: 'gasoline_95'
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
    },
    volume: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0,
        validate: {
            min: { args: [0], msg: 'Объем должен быть положительным числом' }
        }
    },
    frozen: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    edited: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    timestamp: {
        type: DataTypes.BIGINT,
        allowNull: true
    },
    supplier: {
        type: DataTypes.STRING,
        allowNull: true
    },
    customer: {
        type: DataTypes.STRING,
        allowNull: true
    },
    vessel: {
        type: DataTypes.STRING,
        allowNull: true
    },
    paymentMethod: {
        type: DataTypes.STRING,
        allowNull: true
    },
    key: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    timestamps: true,
    hooks: {
        beforeValidate: (transaction) => {
            if (transaction.volume !== undefined && transaction.amount === undefined) {
                transaction.amount = transaction.volume;
            } else if (transaction.amount !== undefined && transaction.volume === undefined) {
                transaction.volume = transaction.amount;
            }
            
            if (transaction.timestamp !== undefined) {
                try {
                    transaction.date = new Date(transaction.timestamp);
                } catch (e) {
                    console.error('Error converting timestamp to date:', e);
                }
            } else if (!transaction.date) {
                transaction.date = new Date();
            }
            
            if (transaction.totalCost === undefined && transaction.price !== undefined && 
               (transaction.volume !== undefined || transaction.amount !== undefined)) {
                const quantity = transaction.volume !== undefined ? transaction.volume : transaction.amount;
                transaction.totalCost = Number(quantity) * Number(transaction.price);
            }
        }
    }
});

// Определяем связи
Shift.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Shift.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });
FuelTransaction.belongsTo(User, { foreignKey: 'userId', as: 'user' });
FuelTransaction.belongsTo(Vehicle, { foreignKey: 'vehicleId', as: 'vehicle' });

// Синхронизируем модели с базой данных с флагом alter для обновления структуры
sequelize.sync({ alter: true }).then(() => {
  console.log('✅ Database sync complete with alter: true');
}).catch(err => {
  console.error('❌ Database sync error:', err);
});

module.exports = {
    User,
    Vehicle,
    Shift,
    FuelTransaction,
    sequelize
}; 