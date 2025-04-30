const bcrypt = require('bcryptjs');
const { User } = require('../models/initModels');

const seedUsers = async () => {
  try {
    // Проверка на существование администратора
    const adminExists = await User.findOne({ where: { username: 'admin@fuel.ru' } });

    if (!adminExists) {
      console.log('Создание администратора по умолчанию...');

      // Создание пользователя
      await User.create({
        username: 'admin@fuel.ru',
        password: 'admin123',  // хеширование произойдет автоматически через хуки
        role: 'admin'
      });

      console.log('Администратор создан');
    } else {
      console.log('Администратор уже существует');
    }
  } catch (error) {
    console.error('Ошибка при создании пользователей:', error);
  }
};

module.exports = seedUsers; 