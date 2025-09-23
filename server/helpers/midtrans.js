const midtransClient = require('midtrans-client');

// Inisialisasi Snap API dengan kredensial dari .env
const snap = new midtransClient.Snap({
  isProduction: false, // Ganti menjadi true saat production
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = snap;
