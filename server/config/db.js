const { Sequelize } = require('sequelize');
const path = require('path');

// Создаем подключение к SQLite
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: path.join(__dirname, '../data/database.sqlite'),
  logging: console.log
});

const connectDB = async () => {
  try {
    await sequelize.authenticate();
    console.log('SQLite подключена успешно');
    // Синхронизируем модели с базой данных
    await sequelize.sync();
    console.log('Модели синхронизированы с базой данных');
  } catch (error) {
    console.error(`Ошибка подключения к SQLite: ${error.message}`);
    process.exit(1);
  }
};

// Экспортируем функцию подключения и сам sequelize для использования в моделях
module.exports = { connectDB, sequelize }; 