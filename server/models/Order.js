const mongoose = require('mongoose');
const { Schema, model, Types } = mongoose;

const OrderItemSchema = new Schema(
  {
    productId: { type: Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    image: { type: String },
    price: { type: Number, required: true }, // integer Rupiah
    quantity: { type: Number, required: true, min: 1 },
    variantName: { type: String, required: true }, // cocok dgn Product.variants[].name
  },
  { _id: false }
);

const AddressInfoSchema = new Schema(
  {
    address: String,
    city: String,
    pincode: String, // kompatibel dgn body kamu
    phone: String,
    notes: String,
  },
  { _id: false }
);

const MidtransSchema = new Schema(
  {
    orderId: String, // sama dgn _id toString()
    transactionId: String,
    transactionStatus: String,
    fraudStatus: String,
    paymentType: String,
    statusCode: String,
    grossAmount: String, // simpan apa adanya dari Midtrans (string)
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

    totalAmount: { type: Number, required: true, min: 0 }, // integer Rupiah (server-side verified)
    orderStatus: {
      type: String,
      enum: ['pending', 'confirmed', 'cancelled', 'expired', 'challenge', 'needs_review'],
      default: 'pending',
      index: true,
    },
    paymentStatus: {
      type: String,
      enum: ['unpaid', 'pending', 'paid', 'failed', 'refund'],
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
