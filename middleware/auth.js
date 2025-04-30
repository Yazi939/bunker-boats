const jwt = require('jsonwebtoken');
const { User } = require('../models/initModels');

// Защита маршрутов
exports.protect = async (req, res, next) => {
  let token;

  try {
    console.log('🔒 AUTH: Checking authorization for path:', req.path);
    console.log('🔒 AUTH: Headers:', JSON.stringify(req.headers));
    
    // Проверяем наличие токена в заголовке Authorization
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
      console.log('🔒 AUTH: Token received:', token ? token.substring(0, 15) + '...' : 'No token');
    } else if (req.cookies && req.cookies.token) {
      // Альтернативный источник токена - из cookies
      token = req.cookies.token;
      console.log('🔒 AUTH: Token from cookies:', token ? token.substring(0, 15) + '...' : 'No token');
    } else if (req.query && req.query.token) {
      // Еще один альтернативный источник - из query параметров
      token = req.query.token;
      console.log('🔒 AUTH: Token from query:', token ? token.substring(0, 15) + '...' : 'No token');
    }

    // Проверяем наличие токена
    if (!token) {
      console.log('🔒 AUTH: No authorization token provided');
      
      // ВРЕМЕННОЕ РЕШЕНИЕ: пропускаем аутентификацию для отладки API
      if (process.env.DISABLE_AUTH === 'true' || req.query.skipAuth === 'true') {
        console.log('🔒 AUTH: Auth check skipped for debugging');
        req.user = { id: 1, username: 'debuguser', role: 'admin' };
        return next();
      }
      
      return res.status(401).json({
        success: false,
        error: 'Для доступа к этому ресурсу необходима авторизация'
      });
    }

    // Верификация токена с использованием того же секретного ключа по умолчанию
    const secret = process.env.JWT_SECRET || 'JFGDJFGDJGFJTOKENSECRETKEY564373';
    console.log('🔒 AUTH: JWT Secret (first 10 chars):', secret.substring(0, 10) + '...');
    
    // Декодируем токен
    let decoded;
    try {
      decoded = jwt.verify(token, secret);
      console.log('🔒 AUTH: Decoded token:', decoded);
    } catch (jwtError) {
      console.error('🔒 AUTH: JWT verification error:', jwtError.message);
      
      // ВРЕМЕННОЕ РЕШЕНИЕ: пропускаем аутентификацию для отладки API
      if (process.env.DISABLE_AUTH === 'true' || req.query.skipAuth === 'true') {
        console.log('🔒 AUTH: Auth check skipped after JWT error');
        req.user = { id: 1, username: 'debuguser', role: 'admin' };
        return next();
      }
      
      return res.status(401).json({
        success: false,
        error: 'Недействительный токен',
        details: process.env.NODE_ENV === 'development' ? jwtError.message : undefined
      });
    }

    if (!decoded || !decoded.id) {
      console.error('🔒 AUTH: Invalid token payload - missing user ID');
      return res.status(401).json({
        success: false,
        error: 'Недействительный токен - отсутствует ID пользователя'
      });
    }

    // Получаем пользователя по ID из токена
    try {
      const user = await User.findByPk(decoded.id);
      console.log('🔒 AUTH: User found:', user ? 'Yes' : 'No');
      
      if (!user) {
        console.log('🔒 AUTH: User ID from token not found in database:', decoded.id);
        return res.status(401).json({
          success: false,
          error: 'Пользователь не найден'
        });
      }
      
      // Добавляем роль и ID пользователя в запрос
      req.user = {
        id: user.id,
        username: user.username,
        role: user.role
      };
      
      console.log('🔒 AUTH: Authentication successful for user:', user.username);
      next();
    } catch (dbError) {
      console.error('🔒 AUTH: Database error when finding user:', dbError.message);
      return res.status(500).json({
        success: false,
        error: 'Ошибка сервера при аутентификации',
        details: process.env.NODE_ENV === 'development' ? dbError.message : undefined
      });
    }
  } catch (err) {
    console.error('🔒 AUTH: Auth middleware uncaught error:', {
      name: err.name,
      message: err.message,
      stack: err.stack
    });
    
    return res.status(500).json({
      success: false,
      error: 'Ошибка сервера при аутентификации',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

// Проверка прав доступа
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      console.log('Authorization failed. User role:', req.user ? req.user.role : 'unknown', 'Required roles:', roles);
      return res.status(403).json({
        success: false,
        error: `Роль ${req.user ? req.user.role : 'unknown'} не имеет доступа к этому ресурсу`
      });
    }
    console.log('Authorization successful for role:', req.user.role);
    next();
  };
}; 