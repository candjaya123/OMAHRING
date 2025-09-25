// File: models/Promo.js

const mongoose = require('mongoose');

const PromoSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Nama promo, cth: "Diskon Kemerdekaan"
    promoCode: { type: String, required: true, unique: true }, // Kode unik, cth: "MERDEKA17"
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true }, // Jenis diskon: persen atau nominal tetap
    discountValue: { type: Number, required: true }, // Nilai diskon
    isActive: { type: Boolean, default: true }, // Status aktif/nonaktif
    startDate: { type: Date }, // Tanggal mulai promo (opsional)
    endDate: { type: Date }, // Tanggal akhir promo (opsional)

    // Syarat dan ketentuan promo
    conditions: {
      minOrders: { type: Number, default: 0 }, // Berdasarkan "poin": minimum total pesanan pelanggan
      applicableProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }], // Berdasarkan produk tertentu
    },
  },
  { timestamps: true }
);

const Promo = mongoose.model('Promo', PromoSchema);
module.exports = Promo;
