const authService = require('./auth.service');
const env = require('../../config/env');

const register = async (req, res, next) => {
  try {
    const user = await authService.register(req.body);
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        id: user.id,
        userName: user.user_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const { user, token } = await authService.login(email, password);

    const isProduction = env.NODE_ENV === 'production';

    res.cookie('token', token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: isProduction ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    }).status(200).json({
      success: true,
      message: 'Logged in successfully',
      data: {
        id: user.id,
        userName: user.user_name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res) => {
  res.clearCookie('token').status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
};

const checkAuth = async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      id: req.user.id,
      userName: req.user.user_name || req.user.userName,
      email: req.user.email,
      role: req.user.role,
    },
  });
};

const checkEmail = async (req, res, next) => {
  try {
    const exists = await authService.checkEmail(req.params.email);
    res.status(200).json({
      success: true,
      data: { exists },
    });
  } catch (error) {
    next(error);
  }
};

const upgradeToMember = async (req, res, next) => {
  try {
    const user = await authService.upgradeToMember(req.body.email);
    res.status(200).json({
      success: true,
      message: 'Account upgraded to member successfully',
      data: {
        id: user.id,
        role: user.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logout,
  checkAuth,
  checkEmail,
  upgradeToMember,
};
