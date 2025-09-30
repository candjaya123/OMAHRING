import { useState } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/utils/currencyFormatters';
import { getOrderStatus, ORDER_STATUS_OPTIONS } from '@/constant/order-status';
import { getPaymentStatus } from '@/constant/payment-status';

export function AdminOrderDetailsDialog({ orderDetails, onUpdateStatus, isLoading }) {
  const [newStatus, setNewStatus] = useState(orderDetails?.orderStatus);

  if (!orderDetails) {
    return null;
  }

  const handleUpdateClick = () => {
    console.log(newStatus);

    onUpdateStatus(orderDetails._id, newStatus);
  };

  return (
    <DialogContent className="sm:max-w-3xl">
      <DialogHeader>
        <DialogTitle>Order Details</DialogTitle>
        <DialogDescription>Order ID: {orderDetails._id}</DialogDescription>
      </DialogHeader>

      <div className="grid gap-6 py-4">
        {/* Customer & Shipping Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h4 className="font-semibold">Customer Information</h4>
            <p className="text-sm text-muted-foreground">{orderDetails.customerName}</p>
            <p className="text-sm text-muted-foreground">{orderDetails.email}</p>
            <p className="text-sm text-muted-foreground">{orderDetails.addressInfo?.phone}</p>
          </div>
          <div className="space-y-2">
            <h4 className="font-semibold">Shipping Address</h4>
            <p className="text-sm text-muted-foreground">
              {orderDetails.addressInfo?.address}, {orderDetails.addressInfo?.city},{' '}
              {orderDetails.addressInfo?.pincode}
            </p>
            {orderDetails.addressInfo?.notes && (
              <p className="text-sm text-muted-foreground italic">
                Notes: {orderDetails.addressInfo.notes}
              </p>
            )}
          </div>
        </div>

        <Separator />

        {/* Order & Payment Summary */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-muted-foreground">Order Status</p>
            <Badge className={getOrderStatus(orderDetails.orderStatus)}>
              {orderDetails.orderStatus.toUpperCase()}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Payment Status</p>
            <Badge className={getPaymentStatus(orderDetails.paymentStatus)}>
              {orderDetails.paymentStatus.toUpperCase()}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Order Date</p>
            <p className="font-medium">{new Date(orderDetails.orderDate).toLocaleString()}</p>
          </div>
          <div className="space-y-1">
            <p className="text-muted-foreground">Total Amount</p>
            <p className="font-bold text-lg">{formatPrice(orderDetails.totalAmount)}</p>
          </div>
        </div>

        <Separator />

        {/* Items List */}
        <div>
          <h4 className="font-semibold mb-4">Items Ordered</h4>
          <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
            {orderDetails.cartItems.map((item, index) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div>
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-muted-foreground">Variant: {item.variantName}</p>
                    <p className="text-sm text-muted-foreground">
                      {item.quantity} x {formatPrice(item.price)}
                    </p>
                  </div>
                </div>
                <p className="font-semibold">{formatPrice(item.quantity * item.price)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Separator />

      <DialogFooter className="flex-col sm:flex-row sm:justify-between items-center gap-4 pt-4">
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <Label htmlFor="order-status" className="whitespace-nowrap">
            Update Order Status
          </Label>
          <Select value={newStatus} onValueChange={setNewStatus}>
            <SelectTrigger id="order-status" className="w-full sm:w-[180px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              {ORDER_STATUS_OPTIONS.map((order) => (
                <SelectItem key={order.value} value={order.value}>
                  {order.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          onClick={handleUpdateClick}
          disabled={newStatus === orderDetails.orderStatus || isLoading}
        >
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
