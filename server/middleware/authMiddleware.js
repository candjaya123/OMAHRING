const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Sesuaikan path ke model User Anda

// =================================================================
// Middleware: Autentikasi - Verifikasi JWT Token
// =================================================================
const authenticate = async (req, res, next) => {
  try {
    let token;

    // Prioritas 1: Ambil token dari cookies (sesuai kode lama Anda)
    if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }
    // Prioritas 2: Ambil dari header Authorization (untuk API/mobile)
    else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorised user!',
      });
    }

    // Verifikasi token - gunakan secret key yang sama dengan kode lama Anda
    const decoded = jwt.verify(token, 'CLIENT_SECRET_KEY');

    // Cari user berdasarkan ID dari token
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorised user!',
      });
    }

    // Simpan data user ke request object dengan format yang konsisten
    req.user = {
      id: user._id.toString(),
      email: user.email,
      userName: user.userName,
      role: user.role,
    };

    next();
  } catch (error) {
    console.error('Error autentikasi:', error);

    return res.status(401).json({
      success: false,
      message: 'Unauthorised user!',
    });
  }
};

// =================================================================
// Middleware: Authorization - Cek Role User
// =================================================================
const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Pastikan user sudah terautentikasi (req.user harus ada)
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Anda harus login terlebih dahulu.',
      });
    }

    // Cek apakah role user ada dalam daftar allowedRoles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Akses ditolak. Role ${req.user.role} tidak memiliki izin untuk mengakses resource ini.`,
      });
    }

    next();
  };
};

// =================================================================
// Middleware: Verifikasi Owner - User hanya bisa akses data sendiri
// Kecuali admin/manager yang bisa akses semua
// =================================================================
const authorizeOwnerOrAdmin = (req, res, next) => {
  const requestedUserId = req.params.userId || req.params.id;
  const currentUserId = req.user.id;
  const currentUserRole = req.user.role;

  // Admin dan Manager bisa akses semua
  if (['admin', 'manager'].includes(currentUserRole)) {
    return next();
  }

  // User biasa hanya bisa akses data sendiri
  if (requestedUserId !== currentUserId) {
    return res.status(403).json({
      success: false,
      message: 'Anda tidak memiliki izin untuk mengakses data ini.',
    });
  }

  next();
};

// =================================================================
// Middleware: Cek apakah user adalah Manager
// =================================================================
const isManager = (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya Manager yang dapat melakukan aksi ini.',
    });
  }
  next();
};

// =================================================================
// Middleware: Cek apakah user adalah Admin atau Manager
// =================================================================
const isAdminOrManager = (req, res, next) => {
  if (!['admin', 'manager'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Akses ditolak. Hanya Admin atau Manager yang dapat melakukan aksi ini.',
    });
  }
  next();
};

module.exports = {
  authenticate,
  authorizeRoles,
  authorizeOwnerOrAdmin,
  isManager,
  isAdminOrManager,
};
