const express = require("express");
const supabase = require("../../config/supabase");

const router = express.Router();

// =================================================================
// GET: Mengambil semua data pengguna
// Endpoint: /api/admin/users/get
// =================================================================
router.get("/get", async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from("users")
      .select("id, userName, email, role, created_at");

    if (error) throw error;

    if (!users || users.length === 0) {
      return res.status(404).json({
        success: false,
        message: "Tidak ada pengguna yang ditemukan.",
      });
    }

    return res.status(200).json({
      success: true,
      data: users.map(user => ({ ...user, _id: user.id })),
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
    const { data: userToUpdate, error: fetchError } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (fetchError || !userToUpdate) {
      return res.status(404).json({
        success: false,
        message: "Pengguna tidak ditemukan.",
      });
    }

    const { data: updatedUser, error: updateError } = await supabase
      .from("users")
      .update({ role })
      .eq("id", userId)
      .select()
      .single();

    if (updateError) throw updateError;

    return res.status(200).json({
      success: true,
      message: `Peran untuk ${updatedUser.userName} berhasil diperbarui menjadi ${role}.`,
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