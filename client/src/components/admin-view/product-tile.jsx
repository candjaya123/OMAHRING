import { useState } from 'react';
import { Button } from '../ui/button';
import { Card, CardContent, CardFooter } from '../ui/card';
import { Badge } from '../ui/badge';
import { Package, Edit2, Trash2, Layout } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

function AdminProductTile({
  product,
  handleDelete,
  handleEdit,
}) {
  const [selectedVariant, setSelectedVariant] = useState(
    product?.variants && product.variants.length > 0 ? product.variants[0] : null
  );

  const handleVariantChange = (variantLabel) => {
    const newVariant = product.variants.find((v) => v.combination.join(' - ') === variantLabel);
    if (newVariant) {
      setSelectedVariant(newVariant);
    }
  };

  const mainImage = product?.media?.images?.[0] || '';

  return (
    <Card className="w-full max-w-sm mx-auto flex flex-col overflow-hidden rounded-xl border-gray-200 bg-white shadow-sm hover:shadow-md transition-shadow duration-300 group">
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        {mainImage ? (
          <img 
            src={mainImage} 
            alt={product?.title} 
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <Layout className="w-12 h-12" />
          </div>
        )}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {product?.category?.map((cat, i) => (
            <Badge key={i} variant="secondary" className="bg-orange-100 text-orange-700 border border-orange-200">
              {cat}
            </Badge>
          ))}
        </div>
      </div>
      
      <CardContent className="flex-grow p-4 space-y-3">
        <h2 className="text-base font-semibold text-gray-900 truncate group-hover:text-orange-500 transition-colors" title={product?.title}>
          {product?.title}
        </h2>

        {product.variants && product.variants.length > 1 && (
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-gray-500">Pilih Varian</label>
            <Select onValueChange={handleVariantChange} defaultValue={selectedVariant?.combination?.join(' - ')}>
              <SelectTrigger className="w-full h-8 bg-white border-gray-200 text-xs focus:ring-1 focus:ring-orange-500">
                <SelectValue placeholder="Pilih varian..." />
              </SelectTrigger>
              <SelectContent className="bg-white border-gray-200">
                {product.variants.map((variant, index) => (
                  <SelectItem key={index} value={variant.combination.join(' - ')}>
                    {variant.combination.join(' - ')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="pt-2 border-t border-gray-100">
          {selectedVariant ? (
            <div className="space-y-1.5">
              <div className="flex justify-between items-end">
                <div className="flex flex-col">
                  {selectedVariant.salePrice > 0 && (
                    <span className="text-xs line-through text-gray-400">
                      Rp {selectedVariant.price.toLocaleString('id-ID')}
                    </span>
                  )}
                  <span className="text-lg font-bold text-gray-900">
                    Rp {(selectedVariant.salePrice || selectedVariant.price).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex items-center text-xs font-medium text-gray-600 bg-gray-50 px-2 py-1 rounded-md border border-gray-100">
                  <Package className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                  {selectedVariant.totalStock}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400 italic">Harga belum diatur</p>
          )}
        </div>
      </CardContent>

      <CardFooter className="grid grid-cols-2 gap-3 p-4 bg-gray-50 border-t border-gray-100">
        <Button 
          variant="outline" 
          onClick={handleEdit}
          className="h-9 border-gray-300 bg-white text-gray-700 hover:bg-gray-100 rounded-md text-sm font-medium"
        >
          <Edit2 className="w-4 h-4 mr-2" /> Edit
        </Button>
        <Button 
          variant="destructive" 
          onClick={() => handleDelete(product?._id)}
          className="h-9 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 border border-red-200 rounded-md text-sm font-medium shadow-none"
        >
          <Trash2 className="w-4 h-4 mr-2" /> Hapus
        </Button>
      </CardFooter>
    </Card>
  );
}

export default AdminProductTile;
