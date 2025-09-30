import { formatDate } from '@/utils/dateFormatters';
import { Badge } from '../ui/badge';
import { DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Separator } from '../ui/separator';
import { formatPrice } from '@/utils/currencyFormatters';

const PAYMENT_STATUS_STYLES = {
  paid: 'bg-blue-600 hover:bg-blue-700',
  unpaid: 'bg-amber-600 hover:bg-amber-700',
  failed: 'bg-red-600 hover:bg-red-700',
  default: 'bg-gray-500',
};

const ORDER_STATUS_STYLES = {
  confirmed: 'bg-green-600 hover:bg-green-700',
  shipped: 'bg-blue-600 hover:bg-blue-700',
  delivered: 'bg-indigo-600 hover:bg-indigo-700',
  rejected: 'bg-red-600 hover:bg-red-700',
  pending: 'bg-gray-600 hover:bg-gray-700',
  default: 'bg-black',
};
// ------------------------------------

function ShoppingOrderDetailsView({ orderDetails }) {
  if (!orderDetails) return null; // Menghindari error jika data belum siap

  const getPaymentStatusStyle = (status) =>
    PAYMENT_STATUS_STYLES[status] || PAYMENT_STATUS_STYLES.default;
  const getOrderStatusStyle = (status) =>
    ORDER_STATUS_STYLES[status] || ORDER_STATUS_STYLES.default;

  return (
    <DialogContent className="sm:max-w-2xl max-w-[90vh]">
      <DialogHeader>
        <DialogTitle>Detail Pesanan</DialogTitle>
        <DialogDescription>
          Berikut adalah rincian lengkap untuk pesanan #{orderDetails._id.substring(0, 8)}...
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        {/* Order Summary & Shipping Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-semibold">Ringkasan Pesanan</h4>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tanggal Pesan:</span>
                <span className="font-medium">{formatDate(orderDetails.orderDate)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status Pembayaran:</span>
                <Badge
                  className={`text-white ${getPaymentStatusStyle(orderDetails.paymentStatus)}`}
                >
                  {orderDetails.paymentStatus?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status Pesanan:</span>
                <Badge className={`text-white ${getOrderStatusStyle(orderDetails.orderStatus)}`}>
                  {orderDetails.orderStatus?.toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h4 className="font-semibold">Info Pengiriman</h4>
            <div className="text-sm text-muted-foreground leading-relaxed">
              <p className="font-semibold text-primary">{orderDetails.customerName}</p>
              <p>{orderDetails.addressInfo.phone}</p>
              <p>{orderDetails.addressInfo.address}</p>
              <p>
                {orderDetails.addressInfo.city}, {orderDetails.addressInfo.pincode}
              </p>
              {orderDetails.addressInfo.notes && (
                <p className="italic mt-1">Catatan: {orderDetails.addressInfo.notes}</p>
              )}
            </div>
          </div>
        </div>

        <Separator />

        {/* Items List */}
        <div>
          <h4 className="font-semibold mb-4">Barang Pesanan</h4>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {orderDetails.cartItems?.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-md border"
                  />
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">Varian: {item.variantName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
                <p className="font-semibold text-right">
                  {formatPrice(item.quantity * item.price)}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Total */}
        <div className="flex justify-end items-center text-lg">
          <span className="text-muted-foreground mr-4">Total Pesanan:</span>
          <span className="font-bold text-xl">{formatPrice(orderDetails.totalAmount)}</span>
        </div>
      </div>
    </DialogContent>
  );
}

export default ShoppingOrderDetailsView;
