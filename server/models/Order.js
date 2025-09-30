const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const OrderItemSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true, min: 1 },
    variantName: { type: String, required: true },
  },
  { _id: false }
);

const AddressInfoSchema = new Schema(
  {
    address: String,
    city: String,
    pincode: String,
    phone: String,
    notes: String,
  },
  { _id: false }
);

const MidtransSchema = new Schema(
  {
    orderId: String,
    snapToken: String, // ← TAMBAHKAN
    tokenExpiry: Date, // ← TAMBAHKAN
    redirectUrl: String, // ← TAMBAHKAN
    transactionId: String,
    transactionStatus: String,
    fraudStatus: String,
    paymentType: String,
    statusCode: String,
    grossAmount: String,
    signatureKey: String,
    rawNotification: Schema.Types.Mixed,
  },
  { _id: false }
);

const OrderSchema = new Schema(
  {
    userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
    customerName: { type: String, required: true },
    email: { type: String, lowercase: true, trim: true },
    cartId: { type: Types.ObjectId, ref: 'Cart' },

    cartItems: { type: [OrderItemSchema], required: true },
    addressInfo: { type: AddressInfoSchema },

    totalAmount: { type: Number, required: true, min: 0 },
    orderStatus: {
      type: String,
      // enum: ['pending', 'confirmed', 'cancelled', 'expired', 'challenge', 'needs_review'],
      enum: [
        'pending', // baru dibuat
        'confirmed', // sudah dibayar / valid
        'processing', // sedang diproses
        'shipped', // dalam perjalanan
        'delivered', // sampai ke customer
        'cancelled', // dibatalkan
        'expired', // kadaluarsa
      ],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      // enum: ['unpaid', 'pending', 'paid', 'failed', 'refund'],
      enum: [
        'unpaid', // belum mulai transaksi
        'pending', // sedang menunggu pembayaran
        'paid', // settlement / capture
        'failed', // deny / cancel / expire
        'refund', // refund / partial_refund
        'chargeback', // chargeback
      ],
      default: 'unpaid',
      index: true,
    },
    paymentMethod: { type: String, default: 'midtrans' },

    midtrans: { type: MidtransSchema },

    orderDate: { type: Date, default: Date.now },
    orderUpdateDate: { type: Date },
  },
  { timestamps: true }
);

module.exports = model('Order', OrderSchema);
