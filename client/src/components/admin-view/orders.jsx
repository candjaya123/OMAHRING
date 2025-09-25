// File: components/admin-view/orders-view.jsx

import { useEffect, useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Dialog } from '../ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { AdminOrderDetailsDialog } from './order-details';
import { useDispatch, useSelector } from 'react-redux';
import { getAllOrdersForAdmin, updateOrderStatus } from '@/store/admin/order-slice';
import { Badge } from '../ui/badge';
import useToast from '@/hooks/useToast';
import { getPaymentStatus } from '@/constant/payment-status';
import { getOrderStatus } from '@/constant/order-status';

function AdminOrdersView() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { orderList, loading } = useSelector((state) => state.adminOrder);
  const dispatch = useDispatch();
  const toast = useToast();

  useEffect(() => {
    dispatch(getAllOrdersForAdmin());
  }, [dispatch]);

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };

  const handleUpdateStatus = (orderId, newStatus) => {
    dispatch(updateOrderStatus({ orderId, newStatus }))
      .unwrap()
      .then(() => {
        toast.toastSuccess('Berhasil', 'Status pesanan berhasil diperbarui.');
      })
      .catch((error) => {
        toast.toastError('Gagal', error.message || 'Terjadi kesalahan saat memperbarui status.');
      });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Semua Pesanan</CardTitle>
          <p className="text-sm text-gray-500">Kelola semua pesanan yang masuk dari pelanggan.</p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status Pembayaran</TableHead>
                <TableHead>Status Order</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderList && orderList.length > 0 ? (
                orderList.map((order) => {
                  const paymentInfo = getPaymentStatus(order.paymentStatus);
                  const orderInfo = getOrderStatus(order.orderStatus);
                  return (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-xs">
                        {order._id.substring(0, 10)}...
                      </TableCell>
                      <TableCell className="font-medium">{order.customerName || '-'}</TableCell>
                      <TableCell>
                        {new Date(order.orderDate).toLocaleDateString('id-ID', {
                          day: '2-digit',
                          month: 'long',
                          year: 'numeric',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`py-1 px-3 text-white ${paymentInfo.color}`}>
                          {paymentInfo.text}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`py-1 px-3 text-white ${orderInfo.color}`}>
                          {orderInfo.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rp {order.totalAmount.toLocaleString('id-ID')}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenDetails(order)}
                        >
                          Lihat Detail
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan="6" className="text-center">
                    Belum ada pesanan.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && handleCloseDetails()}>
        {selectedOrder && (
          <AdminOrderDetailsDialog
            orderDetails={selectedOrder}
            onUpdateStatus={handleUpdateStatus}
            isLoading={loading}
          />
        )}
      </Dialog>
    </div>
  );
}

export default AdminOrdersView;
