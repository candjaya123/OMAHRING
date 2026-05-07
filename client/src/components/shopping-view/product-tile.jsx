import { Card, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useNavigate } from 'react-router-dom';

function ShoppingProductTile({ product }) {
  const navigate = useNavigate();
  
  const displayVariant = product?.variants && product.variants.length > 0 ? product.variants[0] : null;
  const isProductOnSale = product?.variants?.some((v) => v.salePrice > 0) ?? false;
  const isOutOfStock = product?.variants?.every((v) => v.totalStock === 0) ?? true;
  
  const mainImage = product?.media?.images?.[0] || '';
  const price = displayVariant?.salePrice || displayVariant?.price || 0;
  const originalPrice = displayVariant?.price || 0;

  return (
    <Card className="w-full max-w-sm mx-auto flex flex-col overflow-hidden rounded-xl border-gray-100 shadow-sm hover:shadow-md transition-shadow duration-300 cursor-pointer group bg-white">
      <div onClick={() => navigate(`/shop/product/${product._id}`)}>
        <div className="relative aspect-square overflow-hidden bg-gray-50">
          <img 
            src={mainImage} 
            alt={product?.title} 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
          />
          <div className="absolute top-2 left-2 flex flex-col gap-1.5">
            {isOutOfStock ? (
              <Badge className="bg-gray-800 text-white border-none text-[10px] font-medium shadow-none">Habis</Badge>
            ) : isProductOnSale ? (
              <Badge className="bg-red-500 text-white border-none text-[10px] font-medium shadow-none">Sale</Badge>
            ) : null}
            {product.attributes?.isCustomProduct && (
              <Badge className="bg-orange-500 text-white border-none font-semibold uppercase text-[9px] shadow-none">Custom</Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4 flex-grow space-y-1.5">
          <p className="text-[10px] font-semibold text-orange-600 uppercase tracking-wider">
            {product.category?.[0]}
          </p>
          <h2 className="text-sm font-semibold text-gray-800 line-clamp-2 leading-tight" title={product?.title}>
            {product?.title}
          </h2>

          <div className="pt-1">
            {price > 0 ? (
              <div className="flex flex-col">
                 <div className="flex items-center gap-1.5">
                    <span className="text-lg font-bold text-gray-900">
                      Rp {price.toLocaleString('id-ID')}
                    </span>
                 </div>
                 {isProductOnSale && (
                   <div className="flex items-center gap-1">
                      <span className="text-[10px] line-through text-gray-400">
                        Rp {originalPrice.toLocaleString('id-ID')}
                      </span>
                      <span className="text-[10px] text-red-500 font-bold">
                        -{Math.round(((originalPrice - price) / originalPrice) * 100)}%
                      </span>
                   </div>
                 )}
              </div>
            ) : (
              <p className="text-xs text-gray-500 italic">Hubungi admin untuk harga</p>
            )}
          </div>
        </CardContent>
      </div>
      <CardFooter className="p-3 bg-white mt-auto">
        <Button
          onClick={() => navigate(`/shop/product/${product._id}`)}
          className="w-full bg-orange-500 hover:bg-orange-600 h-9 rounded-md text-xs font-semibold shadow-sm transition-colors"
          disabled={isOutOfStock}
        >
          {isOutOfStock ? 'Stok Habis' : 'Lihat Detail'}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ShoppingProductTile;
