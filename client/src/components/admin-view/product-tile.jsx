import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Package } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

function AdminProductTile({
  product,
  setFormData,
  setOpenCreateProductsDialog,
  setCurrentEditedId,
  setUploadedImageUrl, // 🔹 Pastikan prop ini ada
  handleDelete,
}) {
  // State untuk melacak varian yang sedang dipilih
  const [selectedVariant, setSelectedVariant] = useState(
    product?.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  // 🔹 Fix handleEdit function
  const handleEdit = () => {
    setFormData({
      image: product.image || null,
      title: product.title || '',
      description: product.description || '',
      category: product.category || '',
      brand: product.brand || '',
      variants: product.variants || [],
      averageReview: product.averageReview || 0,
    });

    setCurrentEditedId(product._id);

    // 🔹 Set existing image URL jika ada
    if (setUploadedImageUrl && product.image) {
      setUploadedImageUrl(product.image);
    }

    setOpenCreateProductsDialog(true);
  };

  // Fungsi untuk mengubah varian yang ditampilkan
  const handleVariantChange = (variantName) => {
    const newVariant = product.variants.find((v) => v.name === variantName);
    if (newVariant) {
      setSelectedVariant(newVariant);
    }
  };

  return (
    <Card className="w-full max-w-sm mx-auto flex flex-col overflow-hidden rounded-xl border shadow-sm hover:shadow-lg transition-shadow duration-300">
      <div className="relative">
        <img src={product?.image} alt={product?.title} className="w-full h-64 object-cover" />
        <Badge variant="secondary" className="absolute top-2 right-2">
          {product?.category}
        </Badge>
      </div>
      <CardContent className="flex-grow p-4 space-y-3">
        <h2 className="text-lg font-bold truncate" title={product?.title}>
          {product?.title}
        </h2>

        {/* Dropdown untuk memilih varian */}
        {product.variants && product.variants.length > 1 && (
          <div>
            <label className="text-xs font-medium text-gray-500">Pilih Varian</label>
            <Select onValueChange={handleVariantChange} defaultValue={selectedVariant?.name}>
              <SelectTrigger className="w-full mt-1">
                <SelectValue placeholder="Pilih varian..." />
              </SelectTrigger>
              <SelectContent>
                {product.variants.map((variant, index) => (
                  <SelectItem key={`${variant.name}-${index}`} value={variant.name}>
                    {variant.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {selectedVariant ? (
          <>
            <div className="flex justify-between items-center">
              <span
                className={`${
                  selectedVariant.salePrice > 0 ? 'line-through text-gray-500' : 'text-primary'
                } text-lg font-semibold`}
              >
                Rp {selectedVariant.price.toLocaleString('id-ID')}
              </span>
              {selectedVariant.salePrice > 0 && (
                <span className="text-lg font-bold text-red-600">
                  Rp {selectedVariant.salePrice.toLocaleString('id-ID')}
                </span>
              )}
            </div>
            <div className="flex items-center text-sm text-gray-500">
              <Package className="w-4 h-4 mr-2" />
              <span>Stok: {selectedVariant.totalStock}</span>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">Harga belum diatur</p>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center p-4 bg-gray-50 border-t">
        <Button variant="outline" onClick={handleEdit}>
          Edit
        </Button>
        <Button variant="destructive" onClick={() => handleDelete(product?._id)}>
          Hapus
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AdminProductTile;
