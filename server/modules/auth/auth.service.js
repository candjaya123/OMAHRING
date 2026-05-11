const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const authRepository = require('./auth.repository');
const env = require('../../config/env');

const register = async (userData) => {
  const existingUser = await authRepository.findByEmail(userData.email);

  if (existingUser) {
    // If user exists and has a password, they are already registered
    if (existingUser.password) {
      const error = new Error('User already exists with this email.');
      error.statusCode = 409;
      throw error;
    }

    // If user exists but has no password, they were a guest. Upgrade them.
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    return await authRepository.update(existingUser.id, {
      ...userData,
      password: hashedPassword,
    });
  }

  const hashedPassword = await bcrypt.hash(userData.password, 12);
  return await authRepository.create({
    ...userData,
    password: hashedPassword,
  });
};

const login = async (email, password) => {
  const user = await authRepository.findByEmail(email);

  if (!user || !user.password) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    const error = new Error('Invalid credentials.');
    error.statusCode = 401;
    throw error;
  }

  const token = jwt.sign(
    {
      id: user.id,
      role: user.role,
      email: user.email,
      userName: user.user_name,
    },
    env.JWT_SECRET,
    { expiresIn: '7d' }
  );

  return { user, token };
};

const upgradeToMember = async (email) => {
  const user = await authRepository.findByEmail(email);
  if (!user) {
    const error = new Error('User not found.');
    error.statusCode = 404;
    throw error;
  }

  return await authRepository.updateRole(email, 'member');
};

const checkEmail = async (email) => {
  const user = await authRepository.findByEmail(email);
  return !!user;
};

module.exports = {
  register,
  login,
  upgradeToMember,
  checkEmail,
};
