import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';

// UI Components
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog, DialogContent } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Badge } from '../ui/badge';

// Store & Utils
import { getAllOrdersByUserId, getOrderDetails, resetOrderDetails } from '@/store/shop/order-slice';
import { formatPrice } from '@/utils/currencyFormatters';
import ShoppingOrderDetailsView from './order-details';

// Constants for styling
const ORDER_STATUS_STYLES = {
  confirmed: 'bg-green-600 hover:bg-green-700',
  rejected: 'bg-red-600 hover:bg-red-700',
  pending: 'bg-gray-600 hover:bg-gray-700',
  default: 'bg-black',
};

const PAYMENT_STATUS_STYLES = {
  paid: 'bg-blue-600 hover:bg-blue-700',
  unpaid: 'bg-amber-600 hover:bg-amber-700',
  failed: 'bg-red-600 hover:bg-red-700',
  default: 'bg-gray-500',
};

function ShoppingOrders() {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { userOrderList, orderDetails } = useSelector((state) => state.shopOrder);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);

  const sessionId = localStorage.getItem('sessionId');

  // Load order list
  useEffect(() => {
    if (user?.id || sessionId) {
      dispatch(getAllOrdersByUserId(user?.id || sessionId));
    }
  }, [dispatch, user?.id, sessionId]);

  // Klik tombol view details
  const handleFetchOrderDetails = (orderId) => {
    setSelectedOrderId(orderId); // set order yang dipilih
    setIsDialogOpen(true);
    dispatch(getOrderDetails({ id: orderId, isAdmin: false }));
  };

  // Tutup dialog
  const handleCloseDialog = (open) => {
    setIsDialogOpen(open);
    if (!open) {
      setTimeout(() => {
        setSelectedOrderId(null); // reset id yang dipilih
        dispatch(resetOrderDetails());
      }, 200); // tunggu animasi selesai
    }
  };

  const getOrderStatusStyle = (status) =>
    ORDER_STATUS_STYLES[status] || ORDER_STATUS_STYLES.default;

  const getPaymentStatusStyle = (status) =>
    PAYMENT_STATUS_STYLES[status] || PAYMENT_STATUS_STYLES.default;

  // Table body
  const renderTableBody = () => {
    if (!userOrderList || userOrderList.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
            You have no order history yet.
          </TableCell>
        </TableRow>
      );
    }

    return userOrderList.map((orderItem) => (
      <TableRow key={orderItem?._id}>
        <TableCell className="font-medium">{orderItem?._id}</TableCell>
        <TableCell>{new Date(orderItem?.orderDate).toLocaleDateString()}</TableCell>
        <TableCell>
          <Badge className={`py-1 px-3 text-white ${getOrderStatusStyle(orderItem?.orderStatus)}`}>
            {orderItem?.orderStatus?.toUpperCase()}
          </Badge>
        </TableCell>
        <TableCell className="font-semibold">{formatPrice(orderItem?.totalAmount)}</TableCell>
        <TableCell>
          <Badge
            className={`py-1 px-3 text-white ${getPaymentStatusStyle(orderItem?.paymentStatus)}`}
          >
            {orderItem?.paymentStatus?.toUpperCase()}
          </Badge>
        </TableCell>
        <TableCell>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleFetchOrderDetails(orderItem?._id)}
          >
            View Details
          </Button>
        </TableCell>
        <TableCell>
          {orderItem?.paymentStatus === 'unpaid' && (
            <Link to={`/shop/payment-pending/${orderItem?._id}`}>
              <Button size="sm">Pay Now</Button>
            </Link>
          )}
        </TableCell>
      </TableRow>
    ));
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Order History</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Order Date</TableHead>
                <TableHead>Order Status</TableHead>
                <TableHead>Total Price</TableHead>
                <TableHead>Payment Status</TableHead>
                <TableHead>Details</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderTableBody()}</TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog khusus untuk order yang dipilih */}
      <Dialog open={isDialogOpen} onOpenChange={handleCloseDialog}>
        {orderDetails && selectedOrderId === orderDetails?._id && (
          <ShoppingOrderDetailsView orderDetails={orderDetails} />
        )}
      </Dialog>
    </>
  );
}

export default ShoppingOrders;
