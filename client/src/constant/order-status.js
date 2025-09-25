const ORDER_STATUS_MAP = {
  pending: { text: 'Menunggu', color: 'bg-yellow-500' },
  confirmed: { text: 'Dikonfirmasi', color: 'bg-blue-500' },
  processing: { text: 'Diproses', color: 'bg-cyan-500' },
  shipped: { text: 'Dikirim', color: 'bg-indigo-500' },
  delivered: { text: 'Terkirim', color: 'bg-green-500' },
  cancelled: { text: 'Dibatalkan', color: 'bg-red-500' },
  expired: { text: 'Kadaluarsa', color: 'bg-orange-500' },
  default: { text: 'Status Tidak Dikenal', color: 'bg-gray-500' },
};

export const getOrderStatus = (status) => ORDER_STATUS_MAP[status] || ORDER_STATUS_MAP.default;

export const ORDER_STATUS_OPTIONS = Object.entries(ORDER_STATUS_MAP)
  .filter(([key]) => key !== 'default')
  .map(([key, { text }]) => ({
    value: key,
    label: text,
  }));
