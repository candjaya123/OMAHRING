// File: components/admin-view/orders-view.jsx

import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Dialog } from "../ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import AdminOrderDetailsView from "./order-details";
import { useDispatch, useSelector } from "react-redux";
import {
  getAllOrdersForAdmin,
  getOrderDetailsForAdmin,
  resetOrderDetails,
} from "@/store/admin/order-slice";
import { Badge } from "../ui/badge";

// 🔹 Helper untuk status pesanan
const getStatusInfo = (status) => {
  switch (status) {
    case "pending":
      return { text: "Menunggu", color: "bg-yellow-500" };
    case "confirmed":
      return { text: "Dikonfirmasi", color: "bg-blue-500" };
    case "shipping":
      return { text: "Dikirim", color: "bg-cyan-500" };
    case "delivered":
      return { text: "Terkirim", color: "bg-green-500" };
    case "rejected":
      return { text: "Ditolak", color: "bg-red-500" };
    default:
      return { text: status, color: "bg-gray-500" };
  }
};

function AdminOrdersView() {
  const [selectedOrder, setSelectedOrder] = useState(null);
  const { orderList } = useSelector((state) => state.adminOrder);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(getAllOrdersForAdmin());
  }, [dispatch]);

  const handleOpenDetails = (order) => {
    setSelectedOrder(order);
  };

  const handleCloseDetails = () => {
    setSelectedOrder(null);
    dispatch(resetOrderDetails()); // Opsional: jika masih perlu reset state Redux
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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orderList && orderList.length > 0 ? (
                orderList.map((order) => {
                  const statusInfo = getStatusInfo(order.orderStatus);
                  return (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-xs">{order._id.substring(0, 10)}...</TableCell>
                      <TableCell className="font-medium">{order.customerName || "-"}</TableCell>
                      <TableCell>
                        {new Date(order.orderDate).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`py-1 px-3 text-white ${statusInfo.color}`}>
                          {statusInfo.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        Rp {order.totalAmount.toLocaleString("id-ID")}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => handleOpenDetails(order)}>
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

      {/* 🔹 Dialog untuk menampilkan detail pesanan */}
      <Dialog open={!!selectedOrder} onOpenChange={(isOpen) => !isOpen && handleCloseDetails()}>
        {selectedOrder && <AdminOrderDetailsView orderDetails={selectedOrder} />}
      </Dialog>
    </div>
  );
}

export default AdminOrdersView;