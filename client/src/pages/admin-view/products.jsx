import { Fragment, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Trash, AlertCircle } from 'lucide-react';

// Import dari Redux store dan komponen UI Anda
import {
  addNewProduct,
  deleteProduct,
  editProduct,
  fetchAllProducts,
} from '@/store/admin/products-slice';
import ProductImageUpload from '@/components/admin-view/image-upload';
import AdminProductTile from '@/components/admin-view/product-tile';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useToast } from '@/components/ui/use-toast';
import { filterOptions } from '@/config';

// State awal untuk form
const initialFormData = {
  image: null,
  title: '',
  description: '',
  category: '',
  brand: '',
  variants: [],
  averageReview: 0,
};

function AdminProducts() {
  // State Management
  const [openCreateProductsDialog, setOpenCreateProductsDialog] = useState(false);
  const [formData, setFormData] = useState(initialFormData);
  const [imageFile, setImageFile] = useState(null);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [imageLoadingState, setImageLoadingState] = useState(false);
  const [currentEditedId, setCurrentEditedId] = useState(null);
  const [formErrors, setFormErrors] = useState([]);

  // Redux Hooks
  const { productList, isLoading } = useSelector((state) => state.adminProducts);
  const dispatch = useDispatch();
  const { toast } = useToast();

  // Fungsi validasi
  const validateForm = () => {
    const errors = [];
    if (!formData.title) errors.push('Nama produk wajib diisi.');
    if (!formData.description) errors.push('Deskripsi produk wajib diisi.');
    if (!formData.category) errors.push('Kategori produk wajib diisi.');
    if (formData.variants.length === 0) {
      errors.push('Produk harus memiliki setidaknya satu varian.');
    } else {
      formData.variants.forEach((variant, index) => {
        if (!variant.name) errors.push(`Nama untuk Varian #${index + 1} wajib diisi.`);
        if (variant.price < 0) errors.push(`Harga untuk Varian #${index + 1} tidak boleh negatif.`);
        if (variant.totalStock < 0)
          errors.push(`Stok untuk Varian #${index + 1} tidak boleh negatif.`);
      });
    }
    setFormErrors(errors);
    return errors.length === 0;
  };

  useEffect(() => {
    validateForm();
  }, [formData]);

  useEffect(() => {
    dispatch(fetchAllProducts());
  }, [dispatch]);

  // Handler untuk input utama (non-varian)
  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setFormData({ ...formData, [name]: value });
  };

  // Handler untuk input varian
  const handleVariantChange = (index, event) => {
    const { name, value } = event.target;
    const updatedVariants = [...formData.variants];
    updatedVariants[index][name] = value;
    setFormData({ ...formData, variants: updatedVariants });
  };

  const handleAddVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: '', price: 0, salePrice: 0, totalStock: 0 }],
    });
  };

  const handleRemoveVariant = (index) => {
    const updatedVariants = [...formData.variants];
    updatedVariants.splice(index, 1);
    setFormData({ ...formData, variants: updatedVariants });
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentEditedId(null);
    setImageFile(null);
    setUploadedImageUrl('');
    setFormErrors([]);
  };

  const onSubmit = (event) => {
    event.preventDefault();

    // Validasi: pastikan ada gambar
    if (!uploadedImageUrl && !formData.image) {
      toast({
        title: 'Gambar produk wajib diupload!',
        description: 'Silakan upload gambar terlebih dahulu.',
        variant: 'destructive',
      });
      return;
    }

    if (!validateForm()) {
      toast({
        title: 'Form belum valid!',
        description: 'Silakan periksa kembali semua isian.',
        variant: 'destructive',
      });
      return;
    }

    const finalFormData = {
      ...formData,
      image: uploadedImageUrl || formData.image, // Gunakan URL yang sudah diupload
    };

    const action = currentEditedId
      ? editProduct({ id: currentEditedId, formData: finalFormData })
      : addNewProduct(finalFormData);

    dispatch(action).then((result) => {
      if (result.payload?.success) {
        toast({
          title: `Produk berhasil ${currentEditedId ? 'diperbarui' : 'ditambahkan'}.`,
        });
        // 🔹 Tidak perlu fetch ulang, Redux state sudah diupdate otomatis
        setOpenCreateProductsDialog(false);
        resetForm();
      } else {
        toast({
          title: 'Terjadi kesalahan.',
          description: result.payload?.message || 'Silakan coba lagi.',
          variant: 'destructive',
        });
      }
    });
  };

  const handleDelete = (productId) => {
    if (confirm('Apakah Anda yakin ingin menghapus produk ini?')) {
      dispatch(deleteProduct(productId)).then((result) => {
        if (result.payload?.success) {
          toast({ title: 'Produk berhasil dihapus.' });
          // 🔹 Tidak perlu fetchAllProducts lagi karena Redux sudah auto-update
        } else {
          toast({
            title: 'Gagal menghapus produk.',
            description: result.payload?.message || 'Silakan coba lagi.',
            variant: 'destructive',
          });
        }
      });
    }
  };

  return (
    <Fragment>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-5 w-full flex justify-end">
          <Button onClick={() => setOpenCreateProductsDialog(true)}>Tambah Produk Baru</Button>
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {productList && productList.length > 0 ? (
            productList.map((productItem) => (
              <AdminProductTile
                key={productItem._id}
                product={productItem}
                setFormData={setFormData}
                setOpenCreateProductsDialog={setOpenCreateProductsDialog}
                setCurrentEditedId={setCurrentEditedId}
                setUploadedImageUrl={setUploadedImageUrl}
                handleDelete={handleDelete}
              />
            ))
          ) : (
            <p className="col-span-full text-center text-gray-500">
              Belum ada produk yang ditambahkan.
            </p>
          )}
        </div>
      </div>

      <Sheet
        open={openCreateProductsDialog}
        onOpenChange={(isOpen) => {
          if (!isOpen) resetForm();
          setOpenCreateProductsDialog(isOpen);
        }}
      >
        <SheetContent side="right" className="w-full max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="text-2xl font-bold">
              {currentEditedId ? 'Edit Produk' : 'Tambah Produk Baru'}
            </SheetTitle>
          </SheetHeader>
          <form onSubmit={onSubmit} className="py-6 space-y-4">
            <ProductImageUpload
              imageFile={imageFile}
              setImageFile={setImageFile}
              uploadedImageUrl={uploadedImageUrl}
              setUploadedImageUrl={setUploadedImageUrl}
              imageLoadingState={imageLoadingState}
              setImageLoadingState={setImageLoadingState}
              isEditMode={!!currentEditedId}
              initialImage={formData.image}
            />
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nama Produk</label>
                <input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md mt-1"
                  placeholder="Masukkan nama produk"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Deskripsi</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md mt-1"
                  placeholder="Masukkan deskripsi produk"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Kategori</label>
                <select
                  name="category"
                  id="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md mt-1"
                >
                  <option value="" disabled>
                    Pilih Kategori
                  </option>
                  {filterOptions.category.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm font-medium">Merek (Opsional)</label>
                <input
                  name="brand"
                  value={formData.brand}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded-md mt-1"
                  placeholder="Masukkan merek produk"
                />
              </div>
            </div>

            <div className="space-y-4 border-t pt-6">
              <h3 className="text-lg font-semibold">Varian Produk</h3>
              {formData.variants.map((variant, index) => (
                <div key={index} className="grid grid-cols-12 gap-3 p-3 border rounded-md relative">
                  <div className="col-span-12">
                    <label className="text-sm font-medium">Nama Varian</label>
                    <input
                      name="name"
                      value={variant.name}
                      onChange={(e) => handleVariantChange(index, e)}
                      className="w-full p-2 border rounded-md mt-1"
                      placeholder="Contoh: Merah, Ukuran L"
                    />
                  </div>
                  <div className="col-span-6">
                    <label className="text-sm font-medium">Harga</label>
                    <input
                      name="price"
                      type="number"
                      value={variant.price}
                      onChange={(e) => handleVariantChange(index, e)}
                      className="w-full p-2 border rounded-md mt-1"
                    />
                  </div>
                  <div className="col-span-6">
                    <label className="text-sm font-medium">Harga Diskon</label>
                    <input
                      name="salePrice"
                      type="number"
                      value={variant.salePrice}
                      onChange={(e) => handleVariantChange(index, e)}
                      className="w-full p-2 border rounded-md mt-1"
                    />
                  </div>
                  <div className="col-span-12">
                    <label className="text-sm font-medium">Stok</label>
                    <input
                      name="totalStock"
                      type="number"
                      value={variant.totalStock}
                      onChange={(e) => handleVariantChange(index, e)}
                      className="w-full p-2 border rounded-md mt-1"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute top-1 right-1"
                    onClick={() => handleRemoveVariant(index)}
                  >
                    <Trash className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={handleAddVariant} className="w-full">
                + Tambah Varian
              </Button>
            </div>

            {formErrors.length > 0 && (
              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-md">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <AlertCircle className="h-5 w-5 text-yellow-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700 font-semibold">Form belum lengkap:</p>
                    <ul className="mt-2 list-disc list-inside text-sm text-yellow-700">
                      {formErrors.map((error) => (
                        <li key={error}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            )}
            <div className="border-t pt-6">
              <Button
                type="submit"
                disabled={formErrors.length > 0 || isLoading}
                className="w-full"
              >
                {isLoading
                  ? 'Menyimpan...'
                  : currentEditedId
                  ? 'Simpan Perubahan'
                  : 'Simpan Produk'}
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </Fragment>
  );
}

export default AdminProducts;
