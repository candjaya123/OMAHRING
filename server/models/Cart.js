const mongoose = require('mongoose');

const CartSchema = new mongoose.Schema(
  {
    // 🔹 userId sekarang opsional
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    // 🔹 sessionId untuk melacak keranjang tamu
    sessionId: {
      type: String,
      index: true, // index untuk pencarian lebih cepat
    },
    items: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        variant: {
          name: { type: String, required: true },
          price: { type: Number, required: true },
          salePrice: { type: Number, default: 0 },
          totalStock: { type: Number, default: 0 },
        },
      },
    ],
    cartTotal: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Tambahkan index gabungan
CartSchema.index({ userId: 1, sessionId: 1 });

module.exports = mongoose.model('Cart', CartSchema);
