import { Card, CardContent, CardFooter } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

function ShoppingProductTile({ product, handleGetProductDetails }) {
  // Mengambil varian pertama sebagai acuan tampilan
  const displayVariant = product?.variants && product.variants.length > 0 
    ? product.variants[0] 
    : null;

  // Memeriksa apakah ada varian yang sedang diskon
  const isProductOnSale = product?.variants?.some(v => v.salePrice > 0);
  
  // Memeriksa apakah semua varian sudah habis stoknya
  const isOutOfStock = product?.variants?.every(v => v.totalStock === 0);

  return (
    <Card className="w-full max-w-sm mx-auto flex flex-col overflow-hidden rounded-xl border shadow-sm hover:shadow-lg transition-shadow duration-300 cursor-pointer">
      <div onClick={() => handleGetProductDetails(product?._id)}>
        <div className="relative">
          <img
            src={product?.image}
            alt={product?.title}
            className="w-full h-64 object-cover"
          />
          {/* Logika Badge yang disederhanakan */}
          {isOutOfStock ? (
            <Badge className="absolute top-2 left-2 bg-gray-700 hover:bg-gray-800 text-white">
              Habis
            </Badge>
          ) : isProductOnSale ? (
            <Badge className="absolute top-2 left-2 bg-orange-500 hover:bg-orange-600 text-white">
              Sale
            </Badge>
          ) : null}
        </div>
        <CardContent className="p-4 flex-grow">
          <p className="text-sm text-gray-500 mb-1">{product?.category}</p>
          <h2 className="text-lg font-bold mb-2 truncate" title={product?.title}>
            {product?.title}
          </h2>
          
          {/* Menampilkan harga berdasarkan varian pertama */}
          {displayVariant ? (
            <div className="flex items-center gap-2">
              {displayVariant.salePrice > 0 && (
                <span className="text-xl font-bold text-red-600">
                  Rp {displayVariant.salePrice.toLocaleString("id-ID")}
                </span>
              )}
              <span
                className={`${
                  displayVariant.salePrice > 0 
                    ? "line-through text-gray-500 text-sm" 
                    : "text-primary text-xl font-bold"
                }`}
              >
                Rp {displayVariant.price.toLocaleString("id-ID")}
              </span>
            </div>
          ) : (
            <p className="text-sm text-gray-500">Harga belum tersedia</p>
          )}
        </CardContent>
      </div>
      <CardFooter className="p-4 bg-gray-50 border-t">
        {/* Tombol diubah untuk navigasi ke detail produk */}
        <Button 
            onClick={() => handleGetProductDetails(product?._id)} 
            className="w-full bg-gray-700 hover:bg-gray-800"
            disabled={isOutOfStock}
        >
          {isOutOfStock ? "Stok Habis" : "Lihat Detail"}
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ShoppingProductTile;