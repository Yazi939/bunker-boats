const { User } = require('../models/initModels');
const jwt = require('jsonwebtoken');

// @desc    Регистрация пользователя
// @route   POST /api/users/register
// @access  Public
exports.register = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    // Проверка, существует ли пользователь
    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь с таким именем уже существует'
      });
    }

    // Создание пользователя
    const user = await User.create({
      username,
      password,
      role: role || 'user'
    });

    sendTokenResponse(user, 201, res);
  } catch (error) {
    console.error('Registration error:', error);
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Авторизация пользователя
// @route   POST /api/users/login
// @access  Public
exports.login = async (req, res) => {
  try {
    console.log('Login attempt with payload:', { 
      username: req.body.username,
      passwordProvided: !!req.body.password
    });
    
    const { username, password } = req.body;

    // Проверка наличия username и пароля
    if (!username || !password) {
      console.log('Login failed: Missing username or password');
      return res.status(400).json({
        success: false,
        error: 'Пожалуйста, укажите имя пользователя и пароль'
      });
    }

    // Поиск пользователя с паролем
    const user = await User.findOne({ 
      where: { username },
      attributes: { include: ['password'] }
    });

    if (!user) {
      console.log(`Login failed: User with username "${username}" not found`);
      return res.status(401).json({
        success: false,
        error: 'Неверные учетные данные'
      });
    }

    // Проверка пароля
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      console.log(`Login failed: Password mismatch for user "${username}"`);
      return res.status(401).json({
        success: false,
        error: 'Неверные учетные данные'
      });
    }

    console.log(`Login successful for user "${username}" with ID ${user.id}`);
    sendTokenResponse(user, 200, res);
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Получение текущего пользователя
// @route   GET /api/users/me
// @access  Private
exports.getMe = async (req, res) => {
  try {
    console.log('GetMe request received for user ID:', req.user?.id);
    
    // Валидация пользователя из middleware
    if (!req.user || !req.user.id) {
      console.log('GetMe failed: No user in request object');
      return res.status(401).json({
        success: false,
        error: 'Пользователь не авторизован'
      });
    }
    
    // Явное получение всех атрибутов пользователя
    const user = await User.findByPk(req.user.id, {
      attributes: ['id', 'username', 'role', 'lastSync', 'createdAt', 'updatedAt']
    });
    
    if (!user) {
      console.log(`GetMe failed: User with ID ${req.user.id} not found in database`);
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    console.log(`GetMe successful for user "${user.username}" with ID ${user.id}`);
    
    // Форматирование ответа
    res.status(200).json({
      success: true,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        lastSync: user.lastSync,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
  } catch (error) {
    console.error('GetMe error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// Создание и отправка токена в ответе
const sendTokenResponse = (user, statusCode, res) => {
  // Создание токена
  const secret = process.env.JWT_SECRET || 'JFGDJFGDJGFJTOKENSECRETKEY564373';
  const expiresIn = process.env.JWT_EXPIRE || '30d';
  
  console.log(`Creating JWT with secret (first 10 chars): ${secret.substring(0, 10)}... and expiration: ${expiresIn}`);
  
  const token = jwt.sign(
    { id: user.id, role: user.role },
    secret,
    { expiresIn }
  );
  
  console.log(`JWT created for user "${user.username}" with ID ${user.id}`);

  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role
    }
  });
}; 