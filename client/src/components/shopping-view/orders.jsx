import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import ShoppingOrderDetailsView from './order-details';
import { useDispatch, useSelector } from 'react-redux';
import { getAllOrdersByUserId, getOrderDetails, resetOrderDetails } from '@/store/shop/order-slice';
import { Badge } from '../ui/badge';
import { Link } from 'react-router-dom';

function ShoppingOrders() {
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { userOrderList, orderDetails } = useSelector((state) => state.shopOrder);

  function handleFetchOrderDetails(getId) {
    console.log('id', getId);

    dispatch(getOrderDetails({ id: getId, isAdmin: false }));
  }

  useEffect(() => {
    dispatch(getAllOrdersByUserId(user?.id));
  }, [dispatch]);

  useEffect(() => {
    if (orderDetails !== null) setOpenDetailsDialog(true);
  }, [orderDetails]);

  return (
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
              <TableHead>Order Price</TableHead>
              <TableHead>
                <span className="sr-only">Details</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {userOrderList && userOrderList.length > 0
              ? userOrderList.map((orderItem) => (
                  <TableRow key={orderItem?._id}>
                    <TableCell>{orderItem?._id}</TableCell>
                    <TableCell>{orderItem?.orderDate.split('T')[0]}</TableCell>
                    <TableCell>
                      <Badge
                        className={`py-1 px-3 ${
                          orderItem?.orderStatus === 'confirmed'
                            ? 'bg-green-500'
                            : orderItem?.orderStatus === 'rejected'
                            ? 'bg-red-600'
                            : 'bg-black'
                        }`}
                      >
                        {orderItem?.orderStatus}
                      </Badge>
                    </TableCell>
                    <TableCell>${orderItem?.totalAmount}</TableCell>
                    <TableCell>
                      <Dialog
                        open={openDetailsDialog}
                        onOpenChange={() => {
                          setOpenDetailsDialog(false);
                          console.log(openDetailsDialog);

                          dispatch(resetOrderDetails());
                        }}
                      >
                        <Button onClick={() => handleFetchOrderDetails(orderItem?._id)}>
                          View Details
                        </Button>
                        <ShoppingOrderDetailsView orderDetails={orderDetails} />
                      </Dialog>
                    </TableCell>
                    {orderItem?.orderStatus === 'pending' && (
                      <TableCell>
                        <Link to={`/shop/payment-pending`}>
                          <Button>Pembayaran</Button>
                        </Link>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export default ShoppingOrders;
