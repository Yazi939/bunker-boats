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
    const { username, password } = req.body;

    // Проверка наличия username и пароля
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        error: 'Пожалуйста, укажите имя пользователя и пароль'
      });
    }

    // Поиск пользователя с паролем
    const user = await User.findOne({ 
      where: { username }
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Неверные учетные данные'
      });
    }

    // Проверка пароля
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        error: 'Неверные учетные данные'
      });
    }

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
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        error: 'Пользователь не авторизован'
      });
    }
    
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }
    
    res.status(200).json({
      success: true,
      user
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
  // Использование фиксированного значения для expiresIn
  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET || 'JFGDJFGDJGFJTOKENSECRETKEY564373',
    { expiresIn: '30d' }
  );

  // Сохраняем пользователя в localStorage на стороне клиента
  const userResponse = {
    id: user.id,
    username: user.username,
    role: user.role
  };

  res.status(statusCode).json({
    success: true,
    token,
    user: userResponse
  });
}; 