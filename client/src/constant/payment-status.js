const PAYMENT_STATUS_MAP = {
  unpaid: { text: 'Belum Dibayar', color: 'bg-amber-500' },
  pending: { text: 'Menunggu Pembayaran', color: 'bg-yellow-500' },
  paid: { text: 'Sudah Dibayar', color: 'bg-green-500' },
  failed: { text: 'Gagal', color: 'bg-red-500' },
  refund: { text: 'Dikembalikan', color: 'bg-purple-500' },
  chargeback: { text: 'Sengketa Bank', color: 'bg-pink-500' },
  default: { text: 'Status Tidak Dikenal', color: 'bg-gray-500' },
};

export const getPaymentStatus = (status) =>
  PAYMENT_STATUS_MAP[status] || PAYMENT_STATUS_MAP.default;
