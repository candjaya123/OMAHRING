// File: components/admin-view/customers-view.jsx

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { fetchAllUsers, updateUserRole } from "@/store/admin/users-slice";
import { Skeleton } from "@/components/ui/skeleton"; // 🔹 Impor Skeleton

// Helper untuk visualisasi peran
const getRoleInfo = (role) => {
  switch (role) {
    case "admin":
      return { text: "Admin", color: "bg-red-500" };
    case "member":
      return { text: "Member", color: "bg-orange-500" };
    default:
      return { text: "User", color: "bg-gray-500" };
  }
};

function AdminCustomersView() {
  // 🔹 Ambil isLoading dan error dari Redux store
  const { userList, isLoading, error } = useSelector((state) => state.adminUsers);
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchAllUsers());
  }, [dispatch]);

  const handleRoleChange = (userId, newRole) => {
    dispatch(updateUserRole({ userId, role: newRole })).then(() => {
      dispatch(fetchAllUsers());
    });
  };

  // Filter data untuk hanya menampilkan 'user' dan 'member'
  const filteredUserList = userList.filter(
    (user) => user.role === "user" || user.role === "member"
  );

  // 🔹 Komponen untuk menampilkan baris skeleton saat loading
  const TableSkeleton = () => (
    Array(5).fill(0).map((_, index) => (
        <TableRow key={index}>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
            <TableCell><Skeleton className="h-6 w-20 rounded-full" /></TableCell>
            <TableCell className="text-center"><Skeleton className="h-4 w-12 mx-auto" /></TableCell>
            <TableCell><Skeleton className="h-4 w-28" /></TableCell>
            <TableCell className="text-right"><Skeleton className="h-8 w-8 rounded-full" /></TableCell>
        </TableRow>
    ))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Manajemen Pelanggan</CardTitle>
          <p className="text-sm text-gray-500">
            Lihat dan kelola semua pengguna yang terdaftar di sistem.
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Pelanggan</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead className="text-center">Total Pesanan</TableHead>
                <TableHead>Tanggal Bergabung</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeleton />
              ) : error ? (
                <TableRow>
                  <TableCell colSpan="6" className="text-center text-red-500">
                    Gagal memuat data pelanggan. Silakan coba lagi.
                  </TableCell>
                </TableRow>
              ) : filteredUserList && filteredUserList.length > 0 ? (
                filteredUserList.map((user) => {
                  const roleInfo = getRoleInfo(user.role);
                  return (
                    <TableRow key={user._id}>
                      <TableCell className="font-medium">{user.userName}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge className={`py-1 px-3 text-white ${roleInfo.color}`}>
                          {roleInfo.text}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center font-semibold">
                        {user.performance?.totalOrders || 0}
                      </TableCell>
                      <TableCell>
                        {new Date(user.createdAt).toLocaleDateString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.role === "user" && (
                              <DropdownMenuItem onClick={() => handleRoleChange(user._id, 'member')}>
                                Jadikan Member
                              </DropdownMenuItem>
                            )}
                            {user.role === "member" && (
                              <DropdownMenuItem onClick={() => handleRoleChange(user._id, 'user')}>
                                Jadikan User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan="6" className="text-center py-10">
                    Belum ada pelanggan terdaftar.
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

export default AdminCustomersView;