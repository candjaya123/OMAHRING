import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PlusCircle, Edit } from "lucide-react";

// Data contoh (mock data) untuk admin dan manager dengan data performa
const mockAdminUsers = [
  { id: 1, name: "Andi Wijaya", email: "andi.w@omahring.com", role: "admin", performance: { tasksCompleted: 127 } },
  { id: 2, name: "Siti Aminah", email: "siti.a@omahring.com", role: "admin", performance: { tasksCompleted: 98 } },
  { id: 3, name: "Budi Santoso", email: "budi.s@omahring.com", role: "manager", performance: { tasksCompleted: 215 } },
];

// Helper untuk visualisasi peran
const getRoleInfo = (role) => {
  switch (role) {
    case "manager": return { text: "Manager", color: "bg-purple-600" };
    default: return { text: "Admin", color: "bg-red-500" };
  }
};

const initialFormData = { name: "", email: "", password: "", role: "admin" };

function AdminManagementView() {
  const [admins, setAdmins] = useState(mockAdminUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState(initialFormData);

  const handleOpenDialog = (admin = null) => {
    if (admin) {
      setEditingAdmin(admin);
      setFormData({ ...admin, password: "" }); // Kosongkan password saat edit
    } else {
      setEditingAdmin(null);
      setFormData(initialFormData);
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
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
      // Logika untuk mengedit admin (mock)
      setAdmins(admins.map(admin => admin.id === editingAdmin.id ? { ...admin, ...formData } : admin));
      console.log("Admin diperbarui:", formData);
    } else {
      // Logika untuk menambah admin baru (mock)
      const newAdmin = { ...formData, id: Date.now(), performance: { tasksCompleted: 0 } };
      setAdmins([...admins, newAdmin]);
      console.log("Admin baru ditambahkan:", newAdmin);
    }
    handleCloseDialog();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Admin</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Tambah, lihat, dan edit akun admin & manager.</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-orange-500 hover:bg-orange-600">
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Admin Baru
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Lengkap</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Performa</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {admins.map((admin) => {
                const roleInfo = getRoleInfo(admin.role);
                return (
                  <TableRow key={admin.id}>
                    <TableCell className="font-medium">{admin.name}</TableCell>
                    <TableCell>{admin.email}</TableCell>
                    <TableCell><Badge className={`text-white ${roleInfo.color}`}>{roleInfo.text}</Badge></TableCell>
                    <TableCell className="font-medium">{admin.performance?.tasksCompleted || 0} Tugas</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="icon" onClick={() => handleOpenDialog(admin)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog untuk Tambah/Edit Admin */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingAdmin ? 'Edit Admin' : 'Tambah Admin Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div>
              <Label htmlFor="name">Nama Lengkap</Label>
              <Input id="name" name="name" value={formData.name} onChange={handleInputChange} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="email">Alamat Email</Label>
              <Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} className="mt-1" required />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" placeholder={editingAdmin ? "Kosongkan jika tidak ingin diubah" : ""} className="mt-1" required={!editingAdmin} />
            </div>
            <div>
              <Label htmlFor="role">Peran</Label>
              <Select onValueChange={handleRoleChange} value={formData.role}>
                <SelectTrigger id="role" className="w-full mt-1">
                  <SelectValue placeholder="Pilih peran..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
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
