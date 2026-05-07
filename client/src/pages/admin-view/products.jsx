import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  Trash, 
  CheckCircle2, 
  Circle, 
  TrendingUp, 
  ChevronRight, 
  ChevronLeft, 
  Save, 
  Plus, 
  Info, 
  Layout, 
  Image as ImageIcon, 
  Settings2, 
  Truck, 
  Eye,
  X,
  Sparkles,
  AlertCircle,
  MapPin,
  Loader2
} from 'lucide-react';

import {
  addNewProduct,
  deleteProduct,
  editProduct,
  fetchAllProducts,
} from '@/store/admin/products-slice';
import { fetchAllCategories, addCategory as addNewCategoryDb } from '@/store/admin/category-slice'; // 🔹 Impor thunk kategori
import ProductImageUpload from '@/components/admin-view/image-upload';
import AdminProductTile from '@/components/admin-view/product-tile';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/use-toast';
import { nestedCategories } from '@/config';
import { Progress } from '@/components/ui/progress';
import RichTextEditor from '@/components/admin-view/rich-text-editor';
import VariationManager from '@/components/admin-view/variation-manager';
import MobileAppPreview from '@/components/admin-view/mobile-app-preview';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const initialFormData = {
  title: '',
  description: '',
  media: { images: [], video: null },
  category: [],
  attributes: {
    brand: '',
    animalType: '',
    warrantyType: '',
    isCustomProduct: false,
  },
  variationOptions: [],
  variants: [],
  shipping: {
    dimensions: { length: 0, width: 0, height: 0 },
    weight: 0,
    logistics: { hemat: true, reguler: true, nextDay: false },
    dangerousGoods: { containsBattery: false, containsLiquid: false },
  },
  orderTemplate: '',
  averageReview: 0,
};

const STEPS = [
  { id: 'identity', label: 'Identitas Produk', description: 'Nama & Media', icon: ImageIcon },
  { id: 'specs', label: 'Spesifikasi', description: 'Deskripsi & Brand', icon: Info },
  { id: 'sales', label: 'Harga & Varian', description: 'Stok & Variasi', icon: Settings2 },
  { id: 'shipping', label: 'Pengiriman', description: 'Dimensi & Berat', icon: Truck },
];

function AdminProducts() {
  const [openCreateProductsDialog, setOpenCreateProductsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('identity');
  const [formData, setFormData] = useState(initialFormData);
  const [imageLoadingState, setImageLoadingState] = useState(false);
  const [currentEditedId, setCurrentEditedId] = useState(null);
  
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryLabel, setNewCategoryLabel] = useState("");

  const { productList, isLoading } = useSelector((state) => state.adminProducts);
  const { categoryList } = useSelector((state) => state.adminCategory); // 🔹 Ambil list kategori
  const dispatch = useDispatch();
  const { toast } = useToast();

  useEffect(() => {
    dispatch(fetchAllProducts());
    dispatch(fetchAllCategories()); 
  }, [dispatch]);


  const handleAddNewCategory = () => {
    if(!newCategoryLabel.trim()) return;

    const slug = newCategoryLabel
      .toLowerCase()
      .replace(/ /g, "-")
      .replace(/[^\w-]+/g, "");

    dispatch(addNewCategoryDb({ id: slug, label: newCategoryLabel })).then((res) => {
        if(res.payload?.success) {
            toast({ title: 'Kategori Berhasil Ditambah' });
            setNewCategoryLabel("");
            setIsAddingCategory(false);
            dispatch(fetchAllCategories());
        } else {
            toast({ title: 'Gagal', description: 'Kategori mungkin sudah ada.', variant: 'destructive' });
        }
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedInputChange = (parent, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [parent]: { ...prev[parent], [field]: value },
    }));
  };

  const handleShippingChange = (field, value, subField = null) => {
    setFormData((prev) => {
      if (subField) {
        return {
          ...prev,
          shipping: {
            ...prev.shipping,
            [field]: { ...prev.shipping[field], [subField]: value },
          },
        };
      }
      return {
        ...prev,
        shipping: { ...prev.shipping, [field]: value },
      };
    });
  };

  const calculateScore = () => {
    let score = 0;
    if (formData.title.length > 10) score += 20;
    if (formData.media.images.length >= 3) score += 20;
    if (formData.description.length > 100) score += 20;
    if (formData.category.length > 0) score += 20;
    if (formData.variants.length > 0) score += 20;
    return score;
  };

  const score = calculateScore();

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentEditedId(null);
    setActiveTab('identity');
  };

  const onSubmit = (event) => {
    event.preventDefault();
    
    if (formData.title.length < 3) {
      toast({ title: 'Gagal', description: 'Nama produk minimal harus 3 karakter.', variant: 'destructive' });
      return;
    }

    if (formData.media.images.length === 0) {
      toast({ title: 'Gagal', description: 'Minimal 1 foto produk wajib diupload.', variant: 'destructive' });
      return;
    }
    const action = currentEditedId ? editProduct({ id: currentEditedId, formData }) : addNewProduct(formData);
    dispatch(action).then((result) => {
      if (result.payload?.success) {
        setOpenCreateProductsDialog(false);
        resetForm();
        toast({ title: 'Berhasil', description: `Produk berhasil ${currentEditedId ? 'diperbarui' : 'disimpan'}.` });
        dispatch(fetchAllProducts());
      }
    });
  };

  const handleEdit = async (product) => {
    setFormData(product);
    setCurrentEditedId(product._id);
    setOpenCreateProductsDialog(true);
  };

  const handleDelete = (id) => {
    if (window.confirm('Hapus produk ini?')) {
      dispatch(deleteProduct(id)).then((res) => {
        if (res.payload?.success) {
           toast({ title: 'Berhasil dihapus' });
           dispatch(fetchAllProducts());
        }
      });
    }
  };

  return (
    <Fragment>
      <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
        <div className="mb-8 flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
          <div>
            <h1 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
              Manajemen Produk
            </h1>
            <p className="text-gray-500 mt-1 font-medium">Lengkapi katalog Anda dengan produk berkualitas tinggi.</p>
          </div>
          <Button 
            onClick={() => setOpenCreateProductsDialog(true)}
            className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-8 py-6 h-auto font-bold shadow-lg shadow-orange-200 flex gap-2 transition-all transform hover:-translate-y-0.5 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Tambah Produk Baru
          </Button>
        </div>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 lg:gap-8">
          {productList?.map((product) => (
            <AdminProductTile
                key={product._id}
                product={product}
                handleDelete={handleDelete}
                handleEdit={() => handleEdit(product)}
              />
          ))}
        </div>
      </div>

      <Dialog
        open={openCreateProductsDialog}
        onOpenChange={(isOpen) => {
          if (!isOpen) resetForm();
          setOpenCreateProductsDialog(isOpen);
        }}
      >
        <DialogContent className="max-w-none w-full h-[100dvh] top-0 left-0 right-0 bottom-0 translate-x-0 translate-y-0 p-0 m-0 overflow-hidden bg-white border-none shadow-none rounded-none flex flex-col">
          <div className="flex h-full overflow-hidden">
            {/* Left Sidebar: Navigation Stepper */}
            <div className="hidden lg:flex w-72 bg-gray-50 border-r border-gray-100 flex-col p-6">
              <div className="flex items-center gap-3 mb-10 px-2">
                <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center text-white shadow-lg shadow-orange-200">
                  <Layout className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="font-bold text-gray-900 text-sm">Editor Produk</h2>
                  <p className="text-[10px] uppercase tracking-widest text-orange-600 font-bold">Omahring v2.0</p>
                </div>
              </div>

              <div className="space-y-2 flex-grow">
                {STEPS.map((step, index) => {
                  const Icon = step.icon;
                  const isActive = activeTab === step.id;
                  const stepIndex = STEPS.findIndex(s => s.id === activeTab);
                  const isCompleted = index < stepIndex;

                  return (
                    <button
                      key={step.id}
                      onClick={() => setActiveTab(step.id)}
                      className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all duration-200 group ${
                        isActive 
                          ? 'bg-white shadow-md border border-gray-100 translate-x-2' 
                          : 'hover:bg-gray-100/50'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                        isActive ? 'bg-orange-500 text-white' : isCompleted ? 'bg-green-100 text-green-600' : 'bg-gray-200 text-gray-400 group-hover:bg-gray-300'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                      </div>
                      <div className="text-left">
                        <p className={`text-sm font-bold leading-none ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{step.label}</p>
                        <p className="text-[10px] text-gray-400 mt-1">{step.description}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-auto p-4 bg-orange-50 rounded-xl border border-orange-100">
                 <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-orange-700 uppercase">Kelengkapan</span>
                    <span className="text-xs font-black text-orange-700">{score}%</span>
                 </div>
                 <Progress value={score} className="h-1.5 bg-orange-200" indicatorClassName="bg-orange-500" />
              </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-white relative">
              {/* Top Header */}
              <div className="h-16 border-b border-gray-100 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0">
                <h3 className="font-bold text-gray-800 lg:hidden">
                  {STEPS.find(s => s.id === activeTab)?.label}
                </h3>
                <div className="hidden lg:flex items-center gap-2 text-gray-400 text-sm">
                   <Layout className="w-4 h-4" />
                   <ChevronRight className="w-4 h-4" />
                   <span className="text-gray-900 font-semibold">{STEPS.find(s => s.id === activeTab)?.label}</span>
                </div>
                <button onClick={() => setOpenCreateProductsDialog(false)} className="bg-gray-100 hover:bg-gray-200 p-2 rounded-full transition-colors">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* Form Scrollable Area */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50/30">
                <div className="max-w-5xl mx-auto space-y-8">
                  {activeTab === 'identity' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                       <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <Label className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <ImageIcon className="w-5 h-5 text-orange-500" /> Galeri Gambar Produk
                        </Label>
                        <ProductImageUpload
                          media={formData.media}
                          setMedia={(val) => setFormData(prev => ({ ...prev, media: typeof val === 'function' ? val(prev.media) : val }))}
                          imageLoadingState={imageLoadingState}
                          setImageLoadingState={setImageLoadingState}
                        />
                       </div>

                       <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <Label className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <Info className="w-5 h-5 text-orange-500" /> Nama & Kategori
                        </Label>
                        <div className="grid gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">Nama Produk Resmi</Label>
                            <Input
                              name="title"
                              value={formData.title}
                              onChange={handleInputChange}
                              className="h-12 border-gray-200 focus:border-orange-500 rounded-xl"
                              placeholder="Masukkan nama produk yang menarik"
                            />
                          </div>
                          <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm font-semibold text-gray-700">Kategori Utama</Label>
                              <Button 
                                type="button"
                                variant="ghost" 
                                size="sm" 
                                onClick={() => setIsAddingCategory(!isAddingCategory)}
                                className="text-[10px] uppercase font-bold text-orange-600 hover:text-orange-700 hover:bg-orange-50 gap-1 px-2 h-7"
                              >
                                {isAddingCategory ? <X className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                                {isAddingCategory ? 'Batal' : 'Tambah Baru'}
                              </Button>
                            </div>

                            {isAddingCategory && (
                              <div className="flex gap-2 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Input 
                                  placeholder="Nama Kategori Baru..." 
                                  value={newCategoryLabel}
                                  onChange={(e) => setNewCategoryLabel(e.target.value)}
                                  className="h-10 text-xs border-gray-100 bg-gray-50/50"
                                />
                                <Button 
                                  type="button" 
                                  onClick={handleAddNewCategory}
                                  className="bg-gray-900 text-white h-10 px-4 text-xs font-bold rounded-lg shrink-0"
                                >
                                  Simpan
                                </Button>
                              </div>
                            )}

                            <select 
                              className="w-full bg-white border border-gray-200 rounded-xl p-3 h-12 text-sm outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-all font-medium"
                              onChange={(e) => setFormData(prev => ({ ...prev, category: [e.target.value] }))}
                              value={formData.category[0] || ""}
                            >
                              <option value="">Pilih Kategori Produk</option>
                              {categoryList && categoryList.length > 0 
                                ? categoryList.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                                : nestedCategories.map(c => <option key={c.id} value={c.id}>{c.label}</option>)
                              }
                            </select>
                            {categoryList.length === 0 && (
                              <p className="text-[9px] text-gray-400 italic">Menampilkan kategori default dari config. Sertakan database untuk dynamic categories.</p>
                            )}
                          </div>
                        </div>
                       </div>
                    </div>
                  )}

                  {activeTab === 'specs' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                       <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <Label className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <Plus className="w-5 h-5 text-orange-500" /> Informasi Atribut
                        </Label>
                        <div className="grid md:grid-cols-2 gap-6">
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">Merek / Brand</Label>
                            <Input value={formData.attributes.brand} onChange={(e) => handleNestedInputChange('attributes', 'brand', e.target.value)} className="border-gray-200 rounded-xl" placeholder="Contoh: Sangkar Jaya" />
                          </div>
                          <div className="space-y-2">
                            <Label className="text-sm font-semibold text-gray-700">Jenis Hewan</Label>
                            <Input value={formData.attributes.animalType} onChange={(e) => handleNestedInputChange('attributes', 'animalType', e.target.value)} className="border-gray-200 rounded-xl" placeholder="Contoh: Burung Murai" />
                          </div>
                        </div>
                       </div>

                       <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
                        <Label className="text-base font-bold text-gray-900 flex items-center gap-2">
                          <Layout className="w-5 h-5 text-orange-500" /> Deskripsi Lengkap
                        </Label>
                        <RichTextEditor
                          value={formData.description}
                          onChange={(val) => setFormData(prev => ({ ...prev, description: val }))}
                        />
                       </div>

                       <div className="bg-orange-50/30 p-6 rounded-2xl border border-orange-100 space-y-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <Label className="text-orange-900 font-bold block">Produk Custom</Label>
                            <p className="text-[11px] text-orange-600 mt-1 font-medium">Aktifkan jika produk memerlukan format pesanan khusus pembeli.</p>
                          </div>
                          <Switch 
                            checked={formData.attributes.isCustomProduct} 
                            onCheckedChange={(val) => handleNestedInputChange('attributes', 'isCustomProduct', val)} 
                          />
                        </div>
                        {formData.attributes.isCustomProduct && (
                          <div className="space-y-2 animate-in slide-in-from-top-2 pt-4 border-t border-orange-200/50">
                            <Label className="text-sm font-semibold text-gray-700">Format Pesanan Khusus</Label>
                            <textarea
                              placeholder="Masukkan teks panduan format untuk pembeli..."
                              className="w-full bg-white border border-gray-200 focus:border-orange-500 rounded-xl p-4 text-sm min-h-[120px] shadow-inner outline-none transition-all"
                              value={formData.orderTemplate}
                              onChange={(e) => setFormData(prev => ({ ...prev, orderTemplate: e.target.value }))}
                            />
                          </div>
                        )}
                       </div>
                    </div>
                  )}

                  {activeTab === 'sales' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                        <VariationManager
                          variationOptions={formData.variationOptions}
                          setVariationOptions={(val) => setFormData(prev => ({ ...prev, variationOptions: typeof val === 'function' ? val(prev.variationOptions) : val }))}
                          variants={formData.variants}
                          setVariants={(val) => setFormData(prev => ({ ...prev, variants: typeof val === 'function' ? val(prev.variants) : val }))}
                        />
                      </div>
                    </div>
                  )}

                  {activeTab === 'shipping' && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6">
                       <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm space-y-8">
                        <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                             <Label className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Truck className="w-5 h-5 text-orange-500" /> Berat & Dimensi
                             </Label>
                             <div className="space-y-2">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Berat Bersih (gram)</Label>
                                <Input type="number" value={formData.shipping.weight} onChange={(e) => handleShippingChange('weight', e.target.value)} className="rounded-xl h-12 border-gray-200" placeholder="0" />
                             </div>
                             <div className="space-y-3">
                                <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Ukuran Paket (P x L x T) cm</Label>
                                <div className="grid grid-cols-3 gap-3">
                                  <Input placeholder="P" type="number" value={formData.shipping.dimensions.length} onChange={(e) => handleShippingChange('dimensions', e.target.value, 'length')} className="rounded-xl border-gray-200" />
                                  <Input placeholder="L" type="number" value={formData.shipping.dimensions.width} onChange={(e) => handleShippingChange('dimensions', e.target.value, 'width')} className="rounded-xl border-gray-200" />
                                  <Input placeholder="T" type="number" value={formData.shipping.dimensions.height} onChange={(e) => handleShippingChange('dimensions', e.target.value, 'height')} className="rounded-xl border-gray-200" />
                                </div>
                             </div>

                          </div>

                          <div className="space-y-6">
                            <Label className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Settings2 className="w-5 h-5 text-orange-500" /> Opsi Pengiriman
                             </Label>
                             <div className="space-y-3">
                                {['hemat', 'reguler', 'nextDay'].map(log => (
                                  <div key={log} className="flex justify-between items-center bg-gray-50 border border-gray-100 px-4 py-3 rounded-xl hover:bg-white transition-colors">
                                    <span className="capitalize text-sm font-bold text-gray-700">{log}</span>
                                    <Switch checked={formData.shipping.logistics[log]} onCheckedChange={(val) => handleShippingChange('logistics', val, log)} />
                                  </div>
                                ))}
                             </div>
                          </div>
                        </div>

                        <div className="pt-8 border-t border-gray-100">
                           <Label className="text-base font-bold text-gray-900 flex items-center gap-2 mb-6">
                              <AlertCircle className="w-5 h-5 text-red-500" /> Keamanan & Regulasi
                           </Label>
                           <div className="grid md:grid-cols-2 gap-4">
                              <div className="flex justify-between items-center bg-red-50/30 border border-red-100 px-4 py-4 rounded-xl">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800">Mengandung Baterai</span>
                                  <span className="text-[10px] text-gray-500">Barang sensitif pengiriman udara</span>
                                </div>
                                <Switch checked={formData.shipping.dangerousGoods.containsBattery} onCheckedChange={(val) => handleShippingChange('dangerousGoods', val, 'containsBattery')} />
                              </div>
                              <div className="flex justify-between items-center bg-blue-50/30 border border-blue-100 px-4 py-4 rounded-xl">
                                <div className="flex flex-col">
                                  <span className="text-sm font-bold text-gray-800">Zat Cair / Kimia</span>
                                  <span className="text-[10px] text-gray-500">Memerlukan penanganan khusus</span>
                                </div>
                                <Switch checked={formData.shipping.dangerousGoods.containsLiquid} onCheckedChange={(val) => handleShippingChange('dangerousGoods', val, 'containsLiquid')} />
                              </div>
                           </div>
                        </div>
                       </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Sticky Action Bar */}
              <div className="h-20 border-t border-gray-100 bg-white flex items-center justify-between px-4 sm:px-8 shrink-0">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    const tabs = STEPS.map(s => s.id);
                    const idx = tabs.indexOf(activeTab);
                    if (idx > 0) setActiveTab(tabs[idx - 1]);
                  }}
                  disabled={activeTab === STEPS[0].id}
                  className="rounded-xl border-gray-200 px-4 sm:px-6 font-bold text-gray-600 h-9 sm:h-11 text-[10px] sm:text-sm"
                >
                  <ChevronLeft className="w-5 h-5 mr-2" /> Kembali
                </Button>
        <div className="flex gap-2 sm:gap-4">
                  <Button 
                    variant="ghost" 
                    onClick={() => setOpenCreateProductsDialog(false)}
                    className="rounded-xl font-bold text-gray-400 hover:text-gray-600 text-[10px] sm:text-sm"
                  >
                    Batalkan
                  </Button>
                  
                  {activeTab !== STEPS[STEPS.length-1].id && (
                    <Button 
                      type="button" 
                      onClick={() => {
                        const tabs = STEPS.map(s => s.id);
                        const idx = tabs.indexOf(activeTab);
                        setActiveTab(tabs[idx + 1]);
                      }}
                      className="bg-gray-200 text-gray-700 hover:bg-gray-300 rounded-xl px-4 sm:px-10 h-9 sm:h-11 font-bold text-[10px] sm:text-sm transition-all"
                    >
                      Lanjut <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  )}

                  <Button 
                    onClick={onSubmit}
                    disabled={isLoading}
                    className="bg-orange-500 hover:bg-orange-600 text-white rounded-xl px-6 sm:px-12 h-10 sm:h-12 font-black text-[10px] sm:text-sm shadow-xl shadow-orange-500/20 transition-all transform active:scale-95 group"
                  >
                    {isLoading ? (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="mr-2 h-5 w-5 group-hover:scale-110 transition-transform" />
                    )}
                    {currentEditedId ? 'Simpan Perubahan' : 'Terbitkan Produk'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Right Panel: Store Preview & Quality Score */}
            <div className="hidden xl:flex w-[380px] bg-gray-50 border-l border-gray-100 flex-col overflow-y-auto no-scrollbar">
              <div className="p-8 space-y-10">
                <div className="flex items-center justify-between">
                   <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                     <Eye className="w-4 h-4" /> Live Preview
                   </h4>
                   <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-[9px] font-bold rounded-full">MOBILE VIEW</span>
                </div>

                <MobileAppPreview data={formData} />

                <div className="space-y-6 pt-6 border-t border-gray-200">
                  <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" /> Kontrol Kualitas
                  </h4>

                  <div className="space-y-3">
                    {[
                      { label: "Minimal 3 Foto Produk", status: formData.media.images.length >= 3 },
                      { label: "Deskripsi Informatif (>100)", status: formData.description.length > 100 },
                      { label: "Merek & Brand Terisi", status: !!formData.attributes.brand },
                      { label: "Kelengkapan Kategori", status: formData.category.length > 0 },
                    ].map((mission, i) => (
                      <div key={i} className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${
                        mission.status ? 'bg-green-50 border-green-100' : 'bg-white border-gray-100 opacity-60'
                      }`}>
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          mission.status ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-300'
                        }`}>
                          <CheckCircle2 className={`w-4 h-4 ${mission.status ? 'block' : 'opacity-20'}`} />
                        </div>
                        <span className={`text-[11px] font-bold ${mission.status ? 'text-green-700' : 'text-gray-500'}`}>{mission.label}</span>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 bg-gray-900 rounded-2xl flex items-center gap-4 text-white">
                     <div className="w-10 h-10 rounded-full border-2 border-orange-500 border-t-transparent animate-spin flex items-center justify-center">
                        <TrendingUp className="w-4 h-4 text-orange-500 -rotate-45" />
                     </div>
                     <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Bantuan & Support</p>
                        <p className="text-sm font-bold">Butuh bantuan? Tim support siap melayani Anda.</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Fragment>
  );
}

export default AdminProducts;
