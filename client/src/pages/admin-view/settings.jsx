import { useState, useEffect } from "react";
import { useToast } from "@/components/ui/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Truck, Cloud, CreditCard, Store, Save, Loader2 } from "lucide-react";
import api from "@/utils/axios";

function AdminSettings() {
  const [settings, setSettings] = useState({
    biteshipApiKey: "",
    originAreaId: "",
    storeServiceFee: 0,
    cloudinaryCloudName: "",
    cloudinaryApiKey: "",
    cloudinaryApiSecret: "",
    midtransServerKey: "",
    midtransClientKey: "",
    midtransIsProduction: false,
  });
  const [loading, setLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsFetching(true);
    try {
      const response = await api.get("/admin/settings");
      const result = response.data;
      if (result.success && result.data) {
        setSettings({
          biteshipApiKey: result.data.biteshipApiKey || "",
          originAreaId: result.data.originAreaId || "",
          storeServiceFee: result.data.storeServiceFee || 0,
          cloudinaryCloudName: result.data.cloudinaryCloudName || "",
          cloudinaryApiKey: result.data.cloudinaryApiKey || "",
          cloudinaryApiSecret: result.data.cloudinaryApiSecret || "",
          midtransServerKey: result.data.midtransServerKey || "",
          midtransClientKey: result.data.midtransClientKey || "",
          midtransIsProduction: !!result.data.midtransIsProduction,
        });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Gagal memuat pengaturan", variant: "destructive" });
    } finally {
      setIsFetching(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked) => {
    setSettings(prev => ({ ...prev, midtransIsProduction: checked }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await api.post("/admin/settings/update", settings);
      const result = response.data;
      if (result.success) {
        toast({ title: "Berhasil", description: result.message });
      } else {
        toast({ title: "Gagal", description: result.message, variant: "destructive" });
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Error", description: "Gagal menyimpan ke database", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (isFetching) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 bg-gray-50 min-h-full space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2">
            <Store className="w-8 h-8 text-orange-500" />
            Konfigurasi Sistem
          </h1>
          <p className="text-gray-500 font-medium">Kelola seluruh kredensial API dan biaya operasional toko dari satu tempat.</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={loading} 
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold h-12 px-6 rounded-xl shadow-lg shadow-orange-100 flex gap-2"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Simpan Semua Perubahan
        </Button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Section 1: Biteship & Shipping */}
        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-50 rounded-lg">
                <Truck className="w-5 h-5 text-blue-600" />
              </div>
              <CardTitle>Logistik (Biteship)</CardTitle>
            </div>
            <CardDescription>Konfigurasi pengiriman dan titik asal paket.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="biteshipApiKey">Biteship API Key</Label>
              <Input 
                id="biteshipApiKey"
                name="biteshipApiKey"
                value={settings.biteshipApiKey}
                onChange={handleChange}
                type="password"
                placeholder="Ex: biteship_test_..."
                className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="originAreaId">ID Area Asal (Origin Area ID)</Label>
              <Input 
                id="originAreaId"
                name="originAreaId"
                value={settings.originAreaId}
                onChange={handleChange}
                placeholder="Ex: IDNP11..."
                className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 2: Cloudinary */}
        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-50 rounded-lg">
                <Cloud className="w-5 h-5 text-purple-600" />
              </div>
              <CardTitle>Cloudinary (Media Hosting)</CardTitle>
            </div>
            <CardDescription>Kredensial untuk penyimpanan gambar produk.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cloudinaryCloudName">Cloud Name</Label>
              <Input 
                id="cloudinaryCloudName"
                name="cloudinaryCloudName"
                value={settings.cloudinaryCloudName}
                onChange={handleChange}
                placeholder="Cloud Name Anda"
                className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="cloudinaryApiKey">API Key</Label>
                <Input 
                  id="cloudinaryApiKey"
                  name="cloudinaryApiKey"
                  value={settings.cloudinaryApiKey}
                  onChange={handleChange}
                  placeholder="Cloudinary API Key"
                  className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cloudinaryApiSecret">API Secret</Label>
                <Input 
                  id="cloudinaryApiSecret"
                  name="cloudinaryApiSecret"
                  value={settings.cloudinaryApiSecret}
                  onChange={handleChange}
                  type="password"
                  placeholder="Cloudinary API Secret"
                  className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Section 3: Midtrans */}
        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-cyan-50 rounded-lg">
                <CreditCard className="w-5 h-5 text-cyan-600" />
              </div>
              <CardTitle>Midtrans (Payment Gateway)</CardTitle>
            </div>
            <CardDescription>Integrasi gerbang pembayaran otomatis.</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl mb-2">
              <div className="space-y-0.5">
                <Label className="text-sm font-bold">Production Mode</Label>
                <p className="text-xs text-gray-500">Aktifkan untuk menerima pembayaran asli.</p>
              </div>
              <Switch 
                checked={settings.midtransIsProduction}
                onCheckedChange={handleSwitchChange}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="midtransServerKey">Server Key</Label>
              <Input 
                id="midtransServerKey"
                name="midtransServerKey"
                value={settings.midtransServerKey}
                onChange={handleChange}
                type="password"
                placeholder="Midtrans Server Key"
                className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="midtransClientKey">Client Key</Label>
              <Input 
                id="midtransClientKey"
                name="midtransClientKey"
                value={settings.midtransClientKey}
                onChange={handleChange}
                placeholder="Midtrans Client Key"
                className="bg-gray-50 border-gray-200 focus:bg-white transition-all"
              />
            </div>
          </CardContent>
        </Card>

        {/* Section 4: Operational Fees */}
        <Card className="border-none shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="bg-white border-b border-gray-100 pb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-orange-50 rounded-lg">
                <Save className="w-5 h-5 text-orange-600" />
              </div>
              <CardTitle>Biaya Layanan Toko</CardTitle>
            </div>
            <CardDescription>Biaya tetap tambahan per checkout (Handling Fee).</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="storeServiceFee">Biaya Layanan (Rp)</Label>
              <Input 
                id="storeServiceFee"
                name="storeServiceFee"
                type="number"
                value={settings.storeServiceFee}
                onChange={handleChange}
                placeholder="Ex: 2000"
                className="bg-gray-50 border-gray-200 focus:bg-white transition-all h-12 text-lg font-bold"
              />
              <p className="text-sm text-gray-500 italic">
                Akan otomatis dijumlahkan ke total tagihan di luar biaya admin kartu/bank.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="py-4 text-center text-gray-400 text-sm">
        Omahring System Management &bull; Semua data disimpan terenkripsi di Database Supabase.
      </div>
    </div>
  );
}

export default AdminSettings;
