const mongoose = require('mongoose');

const AddressSchema = new mongoose.Schema({
  addressId: { type: String, required: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  kodePos: { type: String, required: true },
  phone: { type: String, required: true },
  notes: { type: String, default: '' },
  name: { type: String, required: true },
  email: { type: String, required: true },
});

const UserSchema = new mongoose.Schema(
  {
    userName: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: false,
    },
    role: {
      type: String,
      enum: ['user', 'member', 'admin', 'manager'],
      default: 'user',
    },
    addresses: [AddressSchema],
    performance: {
      totalOrders: {
        type: Number,
        default: 0,
      },
      totalSpend: {
        type: Number,
        default: 0,
      },
    },
  },
  { timestamps: true }
);

const User = mongoose.model('User', UserSchema);
module.exports = User;
