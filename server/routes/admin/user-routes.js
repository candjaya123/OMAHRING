const express = require("express");
const User = require("../../models/User"); // 🔹 Pastikan path ke model User sudah benar

const router = express.Router();

// =================================================================
// GET: Mengambil semua data pengguna
// Endpoint: /api/admin/users/get
// =================================================================
router.get("/get", async (req, res) => {
  try {
    // Mengambil semua pengguna dari database, tanpa menyertakan password mereka
    const users = await User.find({}).select("-password");

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tidak ada pengguna yang ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error("Error saat mengambil data pengguna:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server. Silakan coba lagi.",
    });
  }
});

// =================================================================
// PUT: Memperbarui peran (role) pengguna
// Endpoint: /api/admin/users/update-role/:userId
// =================================================================
router.put("/update-role/:userId", async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body;

  // Validasi input
  if (!role || !["user", "member", "admin", "manager"].includes(role)) {
    return res.status(400).json({
      success: false,
      message: "Peran (role) tidak valid.",
    });
  }

  try {
    const userToUpdate = await User.findById(userId);

    if (!userToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    // Memperbarui peran pengguna
    userToUpdate.role = role;
    await userToUpdate.save();

    return res.status(200).json({
      success: true,
      message: `Peran untuk ${userToUpdate.userName} berhasil diperbarui menjadi ${role}.`,
    });
  } catch (error) {
    console.error("Error saat memperbarui peran pengguna:", error);
    return res.status(500).json({
      success: false,
      message: "Terjadi kesalahan pada server. Silakan coba lagi.",
    });
  }
});

module.exports = router;