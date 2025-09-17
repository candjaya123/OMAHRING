import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileDown } from "lucide-react";
import { getAllOrdersForAdmin } from "@/store/admin/order-slice"; // Pastikan path ini benar

// Helper untuk status pesanan
const getStatusInfo = (status) => {
  switch (status) {
    case "pending": return { text: "Menunggu", color: "bg-yellow-500" };
    case "confirmed": return { text: "Dikonfirmasi", color: "bg-blue-500" };
    case "shipping": return { text: "Dikirim", color: "bg-cyan-500" };
    case "delivered": return { text: "Terkirim", color: "bg-green-500" };
    case "rejected": return { text: "Ditolak", color: "bg-red-500" };
    default: return { text: status, color: "bg-gray-500" };
  }
};

function AdminReportsView() {
  const dispatch = useDispatch();
  const { orderList, isLoading } = useSelector((state) => state.adminOrder);

  // State untuk filter tanggal
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Ambil semua data pesanan saat komponen dimuat
  useEffect(() => {
    dispatch(getAllOrdersForAdmin());
  }, [dispatch]);

  // Terapkan filter setiap kali tanggal atau daftar pesanan berubah
  useEffect(() => {
    if (orderList.length > 0) {
      const filtered = orderList.filter(order => {
        const orderDate = new Date(order.orderDate);
        const start = startDate ? new Date(startDate) : null;
        const end = endDate ? new Date(endDate) : null;

        if (start) start.setHours(0, 0, 0, 0); // Set ke awal hari
        if (end) end.setHours(23, 59, 59, 999); // Set ke akhir hari

        if (start && end) {
          return orderDate >= start && orderDate <= end;
        }
        if (start) {
          return orderDate >= start;
        }
        if (end) {
          return orderDate <= end;
        }
        return true; // Jika tidak ada filter, tampilkan semua
      });
      setFilteredOrders(filtered);
    } else {
        setFilteredOrders([]);
    }
  }, [startDate, endDate, orderList]);

  // Fungsi untuk mengekspor data ke CSV
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;

    const headers = ["ID Pesanan", "Nama Pelanggan", "Tanggal", "Status", "Total (Rp)"];
    const rows = filteredOrders.map(order => [
      order._id,
      order.customerName,
      new Date(order.orderDate).toLocaleDateString("id-ID"),
      order.orderStatus,
      order.totalAmount,
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n" 
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_penjualan_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Laporan Penjualan</CardTitle>
          <p className="text-sm text-gray-500">Analisis dan ekspor data penjualan Anda.</p>
        </CardHeader>
        <CardContent>
          {/* Bagian Filter dan Ekspor */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6 p-4 border rounded-lg bg-gray-50">
            <div className="flex-1">
              <Label htmlFor="startDate">Tanggal Mulai</Label>
              <Input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="endDate">Tanggal Akhir</Label>
              <Input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button onClick={handleExportCSV} disabled={filteredOrders.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Ekspor ke CSV
              </Button>
            </div>
          </div>

          {/* Tabel Laporan */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Pesanan</TableHead>
                <TableHead>Pelanggan</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan="5" className="text-center">Memuat data...</TableCell></TableRow>
              ) : filteredOrders.length > 0 ? (
                filteredOrders.map((order) => {
                  const statusInfo = getStatusInfo(order.orderStatus);
                  return (
                    <TableRow key={order._id}>
                      <TableCell className="font-mono text-xs">{order._id.substring(0, 10)}...</TableCell>
                      <TableCell className="font-medium">{order.customerName}</TableCell>
                      <TableCell>{new Date(order.orderDate).toLocaleDateString("id-ID")}</TableCell>
                      <TableCell><Badge className={`text-white ${statusInfo.color}`}>{statusInfo.text}</Badge></TableCell>
                      <TableCell className="text-right font-semibold">Rp {order.totalAmount.toLocaleString("id-ID")}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan="5" className="text-center py-10">
                    Tidak ada data yang cocok dengan filter Anda.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminReportsView;
