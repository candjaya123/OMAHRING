import ProductImageUpload from "@/components/admin-view/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { addFeatureImage, getFeatureImages } from "@/store/common-slice";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { DollarSign, ShoppingCart, Users, Trash2, Package, Sparkles, Image as ImageIcon, Layout, Newspaper } from "lucide-react";
import { fetchDashboardStats } from "@/store/admin/analytics-slice";
import { fetchAllArticles } from "@/store/admin/article-slice";
import api from "@/utils/axios";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// =================================================================
// Kartu Statistik dengan Aksen Oranye
// =================================================================
const StatCard = ({ title, value, icon, change }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow duration-300">
    <div className="flex justify-between items-start">
      <div className="flex flex-col">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-800 mt-1">{value}</p>
      </div>
      <div className="bg-orange-100 p-3 rounded-lg">
        {icon}
      </div>
    </div>
    <p className="text-xs text-gray-400 mt-4">{change}</p>
  </div>
);

// =================================================================
// Grafik Penjualan Interaktif dengan Recharts
// =================================================================
const SalesChart = ({ data }) => (
  <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
    <div className="mb-6">
      <h3 className="font-bold text-gray-800 text-lg">Analitik Penjualan</h3>
      <p className="text-xs text-gray-500">Trend pendapatan 30 hari terakhir</p>
    </div>
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data}
          margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
        >
          <defs>
            <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
          <XAxis 
            dataKey="date" 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 10, fill: '#9ca3af'}}
            minTickGap={20}
          />
          <YAxis 
            axisLine={false} 
            tickLine={false} 
            tick={{fontSize: 10, fill: '#9ca3af'}}
            tickFormatter={(val) => val >= 1000000 ? `${(val/1000000).toFixed(1)}M` : `${val/1000}k`}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
            formatter={(value) => [`Rp ${value.toLocaleString('id-ID')}`, 'Penjualan']}
          />
          <Area 
            type="monotone" 
            dataKey="total" 
            stroke="#ea580c" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorSales)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// =================================================================
// AdminDashboard Component
// =================================================================
function AdminDashboard() {
  const [media, setMedia] = useState({ images: [], video: null });
  const [imageLoadingState, setImageLoadingState] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    subtitle: "",
    type: "feature"
  });

  const dispatch = useDispatch();
  const { featureImageList } = useSelector((state) => state.commonFeature);
  const { user } = useSelector((state) => state.auth);
  const { stats, isLoading: statsLoading } = useSelector((state) => state.adminAnalytics);
  const { articleList } = useSelector((state) => state.adminArticle);

  function handleUploadFeatureImage() {
    if (media.images.length === 0) return;
    
    dispatch(addFeatureImage({
      image: media.images[0],
      title: formData.title,
      subtitle: formData.subtitle,
      type: formData.type
    })).then((data) => {
      if (data?.payload?.success) {
        dispatch(getFeatureImages());
        setMedia({ images: [], video: null });
        setFormData({ title: "", subtitle: "", type: "feature" });
      }
    });
  }

  async function handleDeleteFeatureImage(imageId) {
    try {
        const response = await api.delete(`/common/feature/delete/${imageId}`);
        if(response.data.success) {
            dispatch(getFeatureImages());
        }
    } catch (error) {
        console.error("Gagal menghapus gambar:", error);
    }
  }

  useEffect(() => {
    dispatch(getFeatureImages());
    dispatch(fetchDashboardStats());
    dispatch(fetchAllArticles());
  }, [dispatch]);

  const heroImages = featureImageList?.filter(img => img.type === 'hero') || [];
  const showcaseImages = featureImageList?.filter(img => img.type === 'feature') || [];
  const recentArticles = articleList?.slice(0, 3) || [];

  return (
    <div className="bg-gray-50 min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Halo, <span className="text-orange-600">{user?.userName || "Admin"}</span> 👋
            </h1>
            <p className="text-gray-500 mt-1">Selamat datang kembali di pusat kendali Omahring!</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400 bg-white px-4 py-2 rounded-full border border-gray-100 shadow-sm">
             <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
             Dashboard Aktif & Sinkron
          </div>
        </div>

        {/* Top Grid & Media Manager */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Main Content Area */}
          <div className="lg:col-span-8 space-y-8">
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                title="Total Penjualan"
                value={`Rp ${stats.totalSales.toLocaleString('id-ID')}`}
                icon={<DollarSign className="w-5 h-5 text-orange-600" />}
                change="Berdasarkan pesanan lunas"
              />
              <StatCard
                title="Pesanan Baru"
                value={stats.newOrders}
                icon={<ShoppingCart className="w-5 h-5 text-orange-600" />}
                change="Menunggu konfirmasi"
              />
              <StatCard
                title="Total Pelanggan"
                value={stats.totalCustomers}
                icon={<Users className="w-5 h-5 text-orange-600" />}
                change="User terdaftar"
              />
              <StatCard
                title="Total Produk"
                value={stats.totalProducts}
                icon={<Package className="w-5 h-5 text-orange-600" />}
                change="Katalog aktif"
              />
            </div>

            {/* Sales Analytics Chart & Recent Articles Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
                <div className="xl:col-span-7">
                    <SalesChart data={stats.dailySales || []} />
                </div>
                <div className="xl:col-span-5">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-gray-800 text-lg">Artikel Terbaru</h3>
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 text-xs"
                                onClick={() => window.location.href = '/admin/articles'}
                            >
                                Lihat Semua
                            </Button>
                        </div>
                        <div className="space-y-4">
                            {recentArticles.length > 0 ? recentArticles.map((article) => (
                                <div key={article.id} className="flex items-center gap-4 p-3 rounded-xl border border-gray-50 hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => window.location.href = '/admin/articles'}>
                                    <img src={article.image || 'https://placehold.co/100x100?text=News'} className="w-12 h-12 rounded-lg object-cover" alt={article.title} />
                                    <div className="flex-1 overflow-hidden">
                                        <p className="font-bold text-gray-800 text-xs truncate">{article.title}</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[10px] text-orange-500 font-medium px-1.5 py-0.5 bg-orange-50 rounded uppercase">{article.status}</span>
                                            <span className="text-[10px] text-gray-400">{new Date(article.created_at).toLocaleDateString('id-ID')}</span>
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="py-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                    <Newspaper className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                    <p className="text-xs text-gray-400 px-4">Belum ada artikel yang diterbitkan.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Media Manager Display List */}
            <div className="space-y-6">
                
                {/* Hero Slider Section */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Sparkles className="w-5 h-5 text-orange-500" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">Main Hero Slider</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {heroImages.length > 0 ? heroImages.map((img) => (
                            <div key={img.id} className="group relative rounded-xl overflow-hidden border border-gray-100 shadow-sm h-48">
                                <img src={img.image} className="w-full h-full object-cover transition-transform group-hover:scale-105" alt="Hero" />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-end">
                                    <p className="text-white font-bold text-sm truncate">{img.title || "No Title"}</p>
                                    <p className="text-white/70 text-[10px] truncate">{img.subtitle || "No Subtitle"}</p>
                                </div>
                                <button 
                                    onClick={() => handleDeleteFeatureImage(img.id)}
                                    className="absolute top-2 right-2 p-2 bg-white/20 backdrop-blur-md hover:bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        )) : (
                            <div className="col-span-full py-12 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <ImageIcon className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                                <p className="text-gray-400 text-sm">Belum ada Hero Image dinamis.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Showcase Gallery Section */}
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-2 mb-6">
                        <div className="p-2 bg-orange-50 rounded-lg">
                            <Layout className="w-5 h-5 text-orange-500" />
                        </div>
                        <h3 className="font-bold text-gray-800 text-lg">Showcase Gallery</h3>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {showcaseImages.length > 0 ? showcaseImages.map((img) => (
                            <div key={img.id} className="group relative aspect-square rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                                <img src={img.image} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt="Showcase" />
                                <button 
                                    onClick={() => handleDeleteFeatureImage(img.id)}
                                    className="absolute inset-0 bg-red-500/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                                >
                                    <Trash2 className="w-5 h-5" />
                                </button>
                            </div>
                        )) : (
                            <div className="col-span-full py-8 text-center bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                <p className="text-gray-400 text-xs">Galeri kosong.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
          </div>

          {/* Sidebar Area: Uploader */}
          <div className="lg:col-span-4 h-fit sticky top-8">
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-lg space-y-6">
                <div>
                    <h3 className="font-bold text-gray-800 text-lg">Home Media Center</h3>
                    <p className="text-xs text-gray-500">Kelola visual utama halaman depan Anda.</p>
                </div>
                
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Tipe Konten</Label>
                        <Select 
                            value={formData.type} 
                            onValueChange={(val) => setFormData({...formData, type: val})}
                        >
                            <SelectTrigger className="w-full bg-gray-50 border-gray-100 focus:ring-orange-500">
                                <SelectValue placeholder="Pilih Tipe" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="feature">Showcase Gallery (Static)</SelectItem>
                                <SelectItem value="hero">Hero Main Slider (With Text)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Media File</Label>
                        <ProductImageUpload
                            media={media}
                            setMedia={setMedia}
                            setImageLoadingState={setImageLoadingState}
                            imageLoadingState={imageLoadingState}
                        />
                    </div>

                    {formData.type === 'hero' && (
                        <div className="space-y-4 pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Judul Utama</Label>
                                <Input 
                                    placeholder="Contoh: Ring Berkualitas Prima" 
                                    value={formData.title}
                                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                                    className="bg-gray-50 border-gray-100"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Sub-Judul</Label>
                                <Input 
                                    placeholder="Contoh: Menunjang performa sang juara" 
                                    value={formData.subtitle}
                                    onChange={(e) => setFormData({...formData, subtitle: e.target.value})}
                                    className="bg-gray-50 border-gray-100"
                                />
                            </div>
                        </div>
                    )}
                </div>

                <Button
                    onClick={handleUploadFeatureImage}
                    className="w-full h-12 bg-gray-900 hover:bg-orange-600 text-white font-bold transition-all shadow-md active:scale-[0.98]"
                    disabled={media.images.length === 0 || imageLoadingState}
                >
                    {imageLoadingState ? (
                        <span className="flex items-center gap-2">
                            <span className="w-3 h-3 border-2 border-white/30 border-t-white animate-spin rounded-full"></span>
                            Mengunggah...
                        </span>
                    ) : (
                        "Publikasikan Media"
                    )}
                </Button>

                <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
                    <p className="text-[10px] text-orange-600 font-medium">
                        💡 Gunakan gambar beresolusi tinggi (min 1920x1080) untuk Hero Slider agar tampilan tetap tajam di layar desktop.
                    </p>
                </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;