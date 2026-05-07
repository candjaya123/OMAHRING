// File: routes/admin/promo-routes.js
const express = require("express");
const supabase = require("../../config/supabase");

const router = express.Router();

// GET: Mengambil semua promo
router.get("/get", async (req, res) => {
  try {
    const { data: promos, error } = await supabase.from('promos').select('*');
    if (error) throw error;
    res.status(200).json({ success: true, data: promos.map(p => ({ ...p, _id: p.id })) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// POST: Membuat promo baru
router.post("/add", async (req, res) => {
  try {
    const { data: newPromo, error } = await supabase
      .from('promos')
      .insert(req.body)
      .select()
      .single();
    
    if (error) throw error;
    res.status(201).json({ success: true, message: "Promo berhasil dibuat.", data: { ...newPromo, _id: newPromo.id } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Gagal membuat promo.", error });
  }
});

// PUT: Memperbarui promo (misalnya status aktif/nonaktif)
router.put("/update/:id", async (req, res) => {
    try {
        const { data: updatedPromo, error } = await supabase
          .from('promos')
          .update(req.body)
          .eq('id', req.params.id)
          .select()
          .single();

        if (error || !updatedPromo) {
            return res.status(404).json({ success: false, message: "Promo tidak ditemukan." });
        }
        res.status(200).json({ success: true, message: "Promo berhasil diperbarui.", data: { ...updatedPromo, _id: updatedPromo.id } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Gagal memperbarui promo." });
    }
});

module.exports = router;