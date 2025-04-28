const jwt = require('jsonwebtoken');
const User = require('../models/User');

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
    // Верификация токена
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Получаем пользователя по ID из токена
    req.user = await User.findById(decoded.id);
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Для доступа к этому ресурсу необходима авторизация'
    });
  }
};

// Проверка прав доступа
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Роль ${req.user.role} не имеет доступа к этому ресурсу`
      });
    }
    next();
  };
}; 