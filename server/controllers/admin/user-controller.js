const User = require('../../models/User');

// =================================================================
// Middleware: Validasi akses berdasarkan role
// =================================================================
const validateRoleAccess = (requesterRole, targetRole, newRole) => {
  // Manager dapat mengatur admin/manager
  if (requesterRole === 'manager') {
    const allowedRoles = ['admin', 'manager'];
    return allowedRoles.includes(targetRole) && allowedRoles.includes(newRole);
  }

  // Admin dapat mengatur user/member
  if (requesterRole === 'admin') {
    const allowedRoles = ['user', 'member'];
    return allowedRoles.includes(targetRole) && allowedRoles.includes(newRole);
  }

  return false;
};

// =================================================================
// GET: Mengambil data pengguna berdasarkan role requester
// =================================================================
const getAllUsers = async (req, res) => {
  try {
    const requesterRole = req.user.role; // Dari middleware auth
    let users;

    // Manager dapat melihat admin & manager
    if (requesterRole === 'manager') {
      users = await User.find({ role: { $in: ['admin', 'manager'] } })
        .select('-password')
        .sort({ createdAt: -1 });
    }
    // Admin dapat melihat user & member
    else if (requesterRole === 'admin') {
      users = await User.find({ role: { $in: ['user', 'member'] } })
        .select('-password')
        .sort({ createdAt: -1 });
    }
    // Role lain tidak memiliki akses
    else {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melihat data pengguna.',
      });
    }

    return res.status(200).json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    console.error('Error saat mengambil data pengguna:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

// =================================================================
// POST: Membuat user baru (Manager membuat admin/manager)
// =================================================================
const createUser = async (req, res) => {
  try {
    const requesterRole = req.user.role;
    const { userName, email, password, role } = req.body;

    // Validasi input
    if (!userName || !email || !password || !role) {
      return res.status(400).json({
        success: false,
        message: 'Semua field harus diisi.',
      });
    }

    // Validasi role berdasarkan requester
    if (requesterRole === 'manager') {
      if (!['admin', 'manager'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Manager hanya dapat membuat admin atau manager.',
        });
      }
    } else if (requesterRole === 'admin') {
      if (!['user', 'member'].includes(role)) {
        return res.status(403).json({
          success: false,
          message: 'Admin hanya dapat membuat user atau member.',
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk membuat pengguna.',
      });
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email sudah terdaftar.',
      });
    }

    // Buat user baru
    const newUser = new User({
      userName,
      email,
      password, // Pastikan password di-hash di model User (pre-save hook)
      role,
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: `${role} baru berhasil dibuat.`,
      data: {
        id: newUser._id,
        userName: newUser.userName,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (error) {
    console.error('Error saat membuat pengguna:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

// =================================================================
// PUT: Memperbarui role pengguna
// =================================================================
const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role: newRole } = req.body;
    const requesterRole = req.user.role;
    const requesterId = req.user.id;

    // Validasi input
    if (!newRole || !['user', 'member', 'admin', 'manager'].includes(newRole)) {
      return res.status(400).json({
        success: false,
        message: 'Role tidak valid.',
      });
    }

    // Cari user yang akan diupdate
    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    // Cegah user mengubah role diri sendiri
    if (requesterId === userId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak dapat mengubah role diri sendiri.',
      });
    }

    // Validasi akses berdasarkan role
    const hasAccess = validateRoleAccess(requesterRole, userToUpdate.role, newRole);

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: `Anda tidak memiliki akses untuk mengubah role dari ${userToUpdate.role} menjadi ${newRole}.`,
      });
    }

    // Update role
    const oldRole = userToUpdate.role;
    userToUpdate.role = newRole;
    await userToUpdate.save();

    return res.status(200).json({
      success: true,
      message: `Role ${userToUpdate.userName} berhasil diubah dari ${oldRole} menjadi ${newRole}.`,
      data: {
        id: userToUpdate._id,
        userName: userToUpdate.userName,
        email: userToUpdate.email,
        role: userToUpdate.role,
      },
    });
  } catch (error) {
    console.error('Error saat memperbarui role:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

// =================================================================
// DELETE: Menghapus pengguna
// =================================================================
const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterRole = req.user.role;
    const requesterId = req.user.id;

    // Cari user yang akan dihapus
    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    // Cegah user menghapus diri sendiri
    if (requesterId === userId) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak dapat menghapus akun diri sendiri.',
      });
    }

    // Validasi akses berdasarkan role
    if (requesterRole === 'manager') {
      if (!['admin', 'manager'].includes(userToDelete.role)) {
        return res.status(403).json({
          success: false,
          message: 'Manager hanya dapat menghapus admin atau manager.',
        });
      }
    } else if (requesterRole === 'admin') {
      if (!['user', 'member'].includes(userToDelete.role)) {
        return res.status(403).json({
          success: false,
          message: 'Admin hanya dapat menghapus user atau member.',
        });
      }
    } else {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk menghapus pengguna.',
      });
    }

    await User.findByIdAndDelete(userId);

    return res.status(200).json({
      success: true,
      message: `${userToDelete.userName} (${userToDelete.role}) berhasil dihapus.`,
    });
  } catch (error) {
    console.error('Error saat menghapus pengguna:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

// =================================================================
// GET: Mengambil detail satu pengguna
// =================================================================
const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;
    const requesterRole = req.user.role;

    const user = await User.findById(userId).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Pengguna tidak ditemukan.',
      });
    }

    // Validasi akses
    const canAccess =
      (requesterRole === 'manager' && ['admin', 'manager'].includes(user.role)) ||
      (requesterRole === 'admin' && ['user', 'member'].includes(user.role));

    if (!canAccess) {
      return res.status(403).json({
        success: false,
        message: 'Anda tidak memiliki akses untuk melihat pengguna ini.',
      });
    }

    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    console.error('Error saat mengambil detail pengguna:', error);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan pada server.',
    });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  updateUserRole,
  deleteUser,
  getUserById,
};
