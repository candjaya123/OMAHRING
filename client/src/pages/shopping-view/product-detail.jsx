import { fetchProductById, clearCurrentProduct } from '@/store/admin/products-slice';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

function ProductDetailPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();

  const { currentProduct, isLoading, error } = useSelector((state) => state.adminProducts);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [rating, setRating] = useState(0);
  const [reviewMsg, setReviewMsg] = useState('');

  useEffect(() => {
    if (productId) {
      dispatch(fetchProductById(productId));
    }

    return () => {
      dispatch(clearCurrentProduct());
    };
  }, [dispatch, productId]);

  useEffect(() => {
    if (currentProduct && currentProduct.variants && currentProduct.variants.length > 0) {
      setSelectedVariant(currentProduct.variants[0]);
    }
  }, [currentProduct]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Error: {error}</p>
          <Button onClick={() => dispatch(fetchProductById(productId))} className="mt-4">
            Coba Lagi
          </Button>
        </div>
      </div>
    );
  }

  if (!currentProduct) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-gray-600 text-lg">Produk tidak ditemukan</p>
        </div>
      </div>
    );
  }

  const handleAddToCart = () => {
    if (selectedVariant) {
      console.log('Adding to cart:', {
        product: currentProduct,
        variant: selectedVariant,
      });
    }
  };

  const handleAddReview = () => {
    if (rating > 0 && reviewMsg.trim()) {
      console.log('Adding review:', {
        productId: currentProduct._id,
        rating,
        message: reviewMsg,
      });
      setRating(0);
      setReviewMsg('');
    }
  };

  // Destructure untuk readability
  const { title, description, category, image, variants = [], averageReview = 0 } = currentProduct;
  const reviews = []; // Replace dengan data reviews yang sebenarnya

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Kolom Gambar */}
        <div className="relative overflow-hidden rounded-lg aspect-square">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>

        {/* Kolom Detail Produk */}
        <div className="flex flex-col space-y-4">
          <div>
            <p className="text-sm text-gray-500">{category}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 text-base mt-2">{description}</p>
          </div>

          {/* Pemilihan Varian */}
          {variants.length > 0 && (
            <div className="pt-2 md:pt-4">
              <Label className="font-semibold text-gray-800">Pilih Varian:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {variants.map((variant, index) => (
                  <Button
                    key={`${variant.name}-${index}`}
                    variant={selectedVariant?.name === variant.name ? 'default' : 'outline'}
                    onClick={() => setSelectedVariant(variant)}
                    disabled={variant.totalStock === 0}
                    className={`
                      ${
                        selectedVariant?.name === variant.name
                          ? 'bg-orange-500 hover:bg-orange-600 border-orange-500 text-white'
                          : 'bg-white'
                      }
                      ${variant.totalStock === 0 ? 'cursor-not-allowed line-through' : ''}
                    `}
                  >
                    {variant.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Tampilan Harga & Stok */}
          {selectedVariant && (
            <div className="pt-2">
              <div className="flex items-baseline gap-3">
                {selectedVariant.salePrice > 0 && (
                  <p className="text-2xl md:text-3xl font-bold text-red-600">
                    Rp {selectedVariant.salePrice.toLocaleString('id-ID')}
                  </p>
                )}
                <p
                  className={`text-xl md:text-2xl font-bold ${
                    selectedVariant.salePrice > 0 ? 'line-through text-gray-500' : 'text-gray-900'
                  }`}
                >
                  Rp {selectedVariant.price.toLocaleString('id-ID')}
                </p>
              </div>
              <p className="text-sm mt-1 text-gray-600">
                Stok tersedia: {selectedVariant.totalStock}
              </p>
            </div>
          )}

          {/* Rating */}
          <div className="flex items-center gap-2">
            {/* Replace dengan StarRatingComponent jika ada */}
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <span
                  key={star}
                  className={`text-lg ${
                    star <= averageReview ? 'text-yellow-400' : 'text-gray-300'
                  }`}
                >
                  ★
                </span>
              ))}
            </div>
            <span className="text-gray-500 text-sm">({averageReview.toFixed(1)})</span>
          </div>

          {/* Tombol Aksi */}
          <div className="pt-2 md:pt-4">
            <Button
              className="w-full bg-orange-500 hover:bg-orange-600 text-base md:text-lg py-5 md:py-6"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.totalStock === 0}
            >
              {!selectedVariant || selectedVariant.totalStock === 0
                ? 'Stok Habis'
                : 'Tambah ke Keranjang'}
            </Button>
          </div>

          <Separator className="my-2 md:my-4" />

          {/* Bagian Ulasan */}
          <div className="flex-grow overflow-y-auto max-h-[200px] pr-2 space-y-4">
            <h2 className="text-xl font-bold text-gray-800">Ulasan Pelanggan</h2>
            {reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review._id} className="flex gap-4">
                  <Avatar className="w-10 h-10 border">
                    <AvatarFallback>{review.userName[0].toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-bold text-gray-900">{review.userName}</h3>
                    {/* StarRatingComponent placeholder */}
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${
                            star <= review.reviewValue ? 'text-yellow-400' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-600 text-sm mt-1">{review.reviewMessage}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">Belum ada ulasan untuk produk ini.</p>
            )}
          </div>

          {/* Form Tambah Ulasan */}
          <div className="flex flex-col gap-2 pt-4 border-t">
            <Label className="font-semibold text-gray-800">Tulis Ulasan Anda</Label>

            {/* Simple rating input */}
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className={`text-2xl ${
                    star <= rating ? 'text-yellow-400' : 'text-gray-300'
                  } hover:text-yellow-400`}
                >
                  ★
                </button>
              ))}
            </div>

            <Input
              value={reviewMsg}
              onChange={(e) => setReviewMsg(e.target.value)}
              placeholder="Bagaimana pendapat Anda tentang produk ini?"
            />
            <Button onClick={handleAddReview} disabled={reviewMsg.trim() === '' || rating === 0}>
              Kirim Ulasan
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
