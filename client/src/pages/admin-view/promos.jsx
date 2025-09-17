import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/components/ui/use-toast";
import { fetchAllPromos, addNewPromo, updatePromo } from "@/store/admin/promo-slice";
import { PlusCircle } from "lucide-react";

const initialFormData = {
  title: "",
  promoCode: "",
  discountType: "percentage",
  discountValue: 0,
  isActive: true,
  startDate: "",
  endDate: "",
  conditions: {
    minOrders: 0,
  },
};

function AdminPromosView() {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [currentPromoId, setCurrentPromoId] = useState(null);
  
  const { promoList, isLoading } = useSelector((state) => state.adminPromos);
  const dispatch = useDispatch();
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchAllPromos());
  }, [dispatch]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleConditionChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      conditions: { ...formData.conditions, [name]: value },
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const action = currentPromoId
      ? updatePromo({ id: currentPromoId, formData })
      : addNewPromo(formData);

    dispatch(action).then((result) => {
      if (result.payload.success) {
        toast({ title: `Promo berhasil ${currentPromoId ? 'diperbarui' : 'ditambahkan'}.` });
        dispatch(fetchAllPromos());
        setOpenDialog(false);
        resetForm();
      } else {
        toast({ title: "Terjadi kesalahan.", variant: "destructive" });
      }
    });
  };
  
  const resetForm = () => {
      setFormData(initialFormData);
      setCurrentPromoId(null);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Manajemen Promo</CardTitle>
            <p className="text-sm text-gray-500 mt-1">Buat dan kelola kode promo untuk pelanggan Anda.</p>
          </div>
          <Dialog open={openDialog} onOpenChange={(isOpen) => { setOpenDialog(isOpen); if (!isOpen) resetForm(); }}>
            <DialogTrigger asChild>
              <Button className="bg-orange-500 hover:bg-orange-600">
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Promo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{currentPromoId ? 'Edit Promo' : 'Buat Promo Baru'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 py-4">
                <div>
                  <label>Nama Promo</label>
                  <input name="title" value={formData.title} onChange={handleInputChange} className="w-full p-2 border rounded-md mt-1" required />
                </div>
                <div>
                  <label>Kode Promo</label>
                  <input name="promoCode" value={formData.promoCode} onChange={handleInputChange} className="w-full p-2 border rounded-md mt-1" required />
                </div>
                <div className="flex gap-4">
                    <div className="w-1/2">
                        <label>Jenis Diskon</label>
                        <select name="discountType" value={formData.discountType} onChange={handleInputChange} className="w-full p-2 border rounded-md mt-1">
                            <option value="percentage">Persentase (%)</option>
                            <option value="fixed">Nominal Tetap (Rp)</option>
                        </select>
                    </div>
                    <div className="w-1/2">
                        <label>Nilai Diskon</label>
                        <input type="number" name="discountValue" value={formData.discountValue} onChange={handleInputChange} className="w-full p-2 border rounded-md mt-1" required />
                    </div>
                </div>
                <div>
                    <label>Syarat: Min. Total Pembelian (Poin)</label>
                    <input type="number" name="minOrders" value={formData.conditions.minOrders} onChange={handleConditionChange} className="w-full p-2 border rounded-md mt-1" />
                </div>
                <div className="flex items-center justify-between">
                    <label>Status Aktif</label>
                    <Switch checked={formData.isActive} onCheckedChange={(checked) => setFormData({...formData, isActive: checked})} />
                </div>
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? 'Menyimpan...' : 'Simpan Promo'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nama Promo</TableHead>
                <TableHead>Kode</TableHead>
                <TableHead>Diskon</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {promoList && promoList.length > 0 ? (
                promoList.map((promo) => (
                  <TableRow key={promo._id}>
                    <TableCell className="font-medium">{promo.title}</TableCell>
                    <TableCell><Badge variant="outline">{promo.promoCode}</Badge></TableCell>
                    <TableCell>
                      {promo.discountType === 'percentage'
                        ? `${promo.discountValue}%`
                        : `Rp ${promo.discountValue.toLocaleString('id-ID')}`}
                    </TableCell>
                    <TableCell>
                      <Badge className={promo.isActive ? "bg-green-500 text-white" : "bg-gray-500 text-white"}>
                        {promo.isActive ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                        <Button variant="outline" size="sm" onClick={() => { setCurrentPromoId(promo._id); setFormData(promo); setOpenDialog(true); }}>
                            Edit
                        </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan="5" className="text-center">Belum ada promo yang dibuat.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminPromosView;