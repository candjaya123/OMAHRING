import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit, Trash2, Loader2 } from "lucide-react";
import { fetchAllStaff, addNewStaff, editStaff, deleteStaff } from "@/store/admin/staff-slice";
import useToast from "@/hooks/useToast";

const getRoleInfo = (role) => {
  switch (role) {
    case "manager": return { text: "Manager", color: "bg-purple-600" };
    default: return { text: "Admin", color: "bg-red-500" };
  }
};

const safelyFormatDate = (dateString) => {
  if (!dateString) return "-";
  const dateObj = new Date(dateString);
  if (isNaN(dateObj.getTime())) return "-";
  return dateObj.toLocaleDateString("id-ID", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};


const initialFormData = { userName: "", email: "", password: "", role: "admin" };

function AdminManagementView() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const dispatch = useDispatch();
  const { staffList, isLoading } = useSelector((state) => state.adminStaff);
  const { toastSuccess, toastError } = useToast();

  useEffect(() => {
    dispatch(fetchAllStaff());
  }, [dispatch]);

  const handleOpenDialog = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({
        userName: admin.userName,
        email: admin.email,
        password: "",
        role: admin.role
      });
    } else {
      setEditingAdmin(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setFormData(initialFormData);
    setEditingAdmin(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRoleChange = (role) => {
    setFormData((prev) => ({ ...prev, role }));
  }

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingAdmin) {
      dispatch(editStaff({ id: editingAdmin.id, formData })).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllStaff());
          handleCloseDialog();
          toastSuccess("Sukses", "Data pengelola berhasil diperbarui.");
        } else {
          toastError("Gagal", data?.payload?.message || "Terjadi kesalahan saat memperbarui akun.");
        }
      });
    } else {
      dispatch(addNewStaff(formData)).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllStaff());
          handleCloseDialog();
          toastSuccess("Sukses", "Akun pengelola baru berhasil dibuat.");
        } else {
          toastError("Gagal", data?.payload?.message || "Terjadi kesalahan saat membuat akun.");
        }
      });
    }
  };

  const handleDelete = (id) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus pengelola ini?")) {
      dispatch(deleteStaff(id)).then((data) => {
        if (data?.payload?.success) {
          dispatch(fetchAllStaff());
          toastSuccess("Sukses", "Pengelola berhasil dihapus.");
        } else {
          toastError("Gagal", data?.payload?.message || "Terjadi kesalahan saat menghapus pengelola.");
        }
      });
    }
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Admin</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Tambah, lihat, dan kelola akun admin & manager.</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Admin Baru
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nama Pengguna</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Peran</TableHead>
                  <TableHead>Terdaftar Sejak</TableHead>
                  <TableHead className="text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staffList && staffList.length > 0 ? (
                  staffList.map((admin) => {
                    const roleInfo = getRoleInfo(admin.role);
                    return (
                      <TableRow key={admin.id || admin.id || Math.random()}>
                        <TableCell className="font-medium text-orange-700">{admin.userName || admin.username || '-'}</TableCell>
                        <TableCell>{admin.email || '-'}</TableCell>
                        <TableCell>
                          <Badge className={`text-white hover:opacity-80 transition-opacity ${roleInfo.color}`}>
                            {roleInfo.text}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500 text-sm">
                          {safelyFormatDate(admin.created_at || admin.createdAt)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="icon" onClick={() => handleOpenDialog(admin)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="icon" onClick={() => handleDelete(admin.id)} className="text-red-500 hover:text-red-700 hover:bg-red-50">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-10 text-gray-400">
                      Tidak ada data pengelola ditemukan.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog untuk Tambah/Edit Admin */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              {editingAdmin ? 'Edit Admin' : 'Tambah Admin Baru'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="userName">Nama Pengguna</Label>
              <Input
                id="userName"
                name="userName"
                value={formData.userName}
                onChange={handleInputChange}
                placeholder="misal: budi_manager"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Alamat Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="email@contoh.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={editingAdmin ? "Kosongkan jika tidak ingin diubah" : "Pilih password yang kuat"}
                required={!editingAdmin}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Peran</Label>
              <Select onValueChange={handleRoleChange} value={formData.role}>
                <SelectTrigger id="role" className="w-full">
                  <SelectValue placeholder="Pilih peran..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager (owner)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-3 pt-6">
              <Button type="button" variant="ghost" onClick={handleCloseDialog}>
                Batal
              </Button>
              <Button type="submit" className="bg-orange-600 hover:bg-orange-700 text-white min-w-[120px]">
                {editingAdmin ? 'Simpan Perubahan' : 'Simpan Admin'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AdminManagementView;
