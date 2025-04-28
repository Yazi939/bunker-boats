const bcrypt = require('bcryptjs');
const User = require('../models/User');

const seedUsers = async () => {
  try {
    // Проверка на существование администратора
    const adminExists = await User.findOne({ where: { email: 'admin@fuel.ru' } });
    
    if (!adminExists) {
      console.log('Создание администратора по умолчанию...');
      
      // Хеширование пароля
      const salt = await bcrypt.genSalt(10);
      const password = await bcrypt.hash('admin123', salt);
      
      // Создание пользователя
      await User.create({
        name: 'Администратор',
        email: 'admin@fuel.ru',
        password: password,
        role: 'admin'
      });
      
      console.log('Администратор создан');
    }
  } catch (error) {
    console.error('Ошибка при создании пользователей:', error);
  }
};

module.exports = seedUsers; 