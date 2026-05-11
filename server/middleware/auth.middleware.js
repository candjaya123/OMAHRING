const jwt = require('jsonwebtoken');
const supabase = require('../config/supabase');
const env = require('../config/env');

/**
 * Authentication Middleware
 * Verifies JWT token from cookies or Authorization header.
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required. Please login.',
      });
    }

    const decoded = jwt.verify(token, env.JWT_SECRET);

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, user_name, role')
      .eq('id', decoded.id)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired session. Please login again.',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AuthMiddleware.authenticate] Error:', error.message);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed.',
    });
  }
};

/**
 * Authorization Middleware
 * Restricts access based on user roles.
 */
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required.',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user.role}' is not authorized.`,
      });
    }

    next();
  };
};

/**
 * Owner or Admin Authorization
 * Allows access if the user is an admin/manager OR is the owner of the resource.
 */
const authorizeOwnerOrAdmin = (req, res, next) => {
  const requestedUserId = req.params.userId || req.params.id;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  if (['admin', 'manager'].includes(currentUserRole)) {
    return next();
  }

  if (requestedUserId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'You do not have permission to access this resource.',
    });
  }

  next();
};

module.exports = {
  authenticate,
  authorizeRoles,
  authorizeOwnerOrAdmin,
};
