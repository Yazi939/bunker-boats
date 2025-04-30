const jwt = require('jsonwebtoken');
const { User } = require('../models/initModels');

// Защита маршрутов
exports.protect = async (req, res, next) => {
  let token;

  // Проверяем наличие токена в заголовке Authorization
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Проверяем наличие токена
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Для доступа к этому ресурсу необходима авторизация'
    });
  }

  try {
    // Верификация токена с использованием того же секретного ключа по умолчанию
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'JFGDJFGDJGFJTOKENSECRETKEY564373');

    // Получаем пользователя по ID из токена
    const user = await User.findByPk(decoded.id);
    
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({
      success: false,
      error: 'Недействительный токен'
    });
  }
};

// Проверка прав доступа
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Роль ${req.user ? req.user.role : 'unknown'} не имеет доступа к этому ресурсу`
      });
    }
    next();
  };
}; 