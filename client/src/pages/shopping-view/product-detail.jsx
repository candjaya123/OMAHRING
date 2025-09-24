import { fetchProductById, clearCurrentProduct } from '@/store/admin/products-slice';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { addToCart, fetchCartItems } from '@/store/shop/cart-slice';
import useToast from '@/hooks/useToast';

function ProductDetailPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();

  const {
    currentProduct,
    isLoading: productLoading,
    error: productError,
  } = useSelector((state) => state.adminProducts);
  const { user } = useSelector((state) => state.auth);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [rating, setRating] = useState(0);
  const [reviewMsg, setReviewMsg] = useState('');
  const sessionId = localStorage.getItem('sessionId');

  const handleAddToCart = async () => {
    try {
      const cartData = {
        userId: user?.id || null,
        sessionId: sessionId || null,
        productId: currentProduct._id,
        quantity: selectedQuantity,
        variant: {
          name: selectedVariant.name,
          price: selectedVariant.price,
          salePrice: selectedVariant.salePrice || 0,
          totalStock: selectedVariant.totalStock,
        },
      };

      const result = await dispatch(addToCart(cartData));

      if (result.payload?.success) {
        toast.toastSuccess('Sukses', 'Produk berhasil ditambahkan ke keranjang!');
        console.log('Add to cart result:', result.payload);

        if (result.payload.data?.sessionId) {
          localStorage.setItem('sessionId', result.payload.data.sessionId);
        } else {
          toast.toastError('Gagal', 'Gagal mendapatkan sessionId dari server.');
        }

        dispatch(fetchCartItems(user?.id || sessionId));
      } else {
        // 🔹 Tambahkan ini biar pesan gagal dari server muncul
        toast.toastError('Gagal', result.payload?.message || 'Gagal menambahkan ke keranjang.');
      }
    } catch (error) {
      toast.toastError('Error', error.message || 'Terjadi Kesalahan');
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

  if (productLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
          <p className="mt-4">Memuat produk...</p>
        </div>
      </div>
    );
  }

  if (productError) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600 text-lg">Error: {productError}</p>
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

  const { title, description, category, image, variants = [] } = currentProduct;
  const reviews = [];

  return (
    <div className="max-w-screen-xl mx-auto px-5 sm:px-10 xl:px-0 pt-10">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
        <div className="md:col-span-6 xl:col-span-4 overflow-hidden rounded-lg aspect-square max-h-96">
          <img src={image} alt={title} className="w-full h-full object-cover" />
        </div>

        <div className="md:col-span-6 xl:col-span-7 flex flex-col space-y-4">
          <div>
            <p className="text-sm text-gray-500">{category}</p>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">{title}</h1>
            <p className="text-gray-600 text-base mt-2">{description}</p>
          </div>

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

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() => setSelectedQuantity((prev) => Math.max(1, prev - 1))}
              disabled={selectedQuantity <= 1}
              aria-label="Kurangi jumlah"
            >
              -
            </Button>
            <span className="px-3">{selectedQuantity}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={() =>
                setSelectedQuantity((prev) =>
                  selectedVariant ? Math.min(selectedVariant.totalStock, prev + 1) : prev + 1
                )
              }
              disabled={
                !selectedVariant ||
                selectedQuantity >= (selectedVariant ? selectedVariant.totalStock : 1)
              }
              aria-label="Tambah jumlah"
            >
              +
            </Button>
          </div>

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

          <div className="flex flex-col gap-2 pt-4 border-t">
            <Label className="font-semibold text-gray-800">Tulis Ulasan Anda</Label>

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
