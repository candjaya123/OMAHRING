// File: routes/admin/promo-routes.js

const express = require("express");
const Promo = require("../../models/Promo"); // Pastikan path model benar

const router = express.Router();

// GET: Mengambil semua promo
router.get("/get", async (req, res) => {
  try {
    const promos = await Promo.find({});
    res.status(200).json({ success: true, data: promos });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// POST: Membuat promo baru
router.post("/add", async (req, res) => {
  try {
    const newPromo = new Promo(req.body);
    await newPromo.save();
    res.status(201).json({ success: true, message: "Promo berhasil dibuat.", data: newPromo });
  } catch (error) {
    res.status(500).json({ success: false, message: "Gagal membuat promo.", error });
  }
});

// PUT: Memperbarui promo (misalnya status aktif/nonaktif)
router.put("/update/:id", async (req, res) => {
    try {
        const updatedPromo = await Promo.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updatedPromo) {
            return res.status(404).json({ success: false, message: "Promo tidak ditemukan." });
        }
        res.status(200).json({ success: true, message: "Promo berhasil diperbarui.", data: updatedPromo });
    } catch (error) {
        res.status(500).json({ success: false, message: "Gagal memperbarui promo." });
    }
});


module.exports = router;