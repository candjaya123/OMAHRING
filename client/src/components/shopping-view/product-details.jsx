import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Dialog, DialogContent } from '../ui/dialog';
import { Button } from '../ui/button';
import { useToast } from '../ui/use-toast';
import { Separator } from '../ui/separator';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Avatar, AvatarFallback } from '../ui/avatar';
import StarRatingComponent from '../common/star-rating';
import { addToCart, fetchCartItems } from '@/store/shop/cart-slice'; // Tambah fetchCartItems
import { setProductDetails } from '@/store/shop/products-slice';
import { addReview, getReviews } from '@/store/shop/review-slice';
import { v4 as uuidv4 } from 'uuid';

function ProductDetailsDialog({ open, setOpen, productDetails }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [reviewMsg, setReviewMsg] = useState('');
  const [rating, setRating] = useState(0);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { reviews } = useSelector((state) => state.shopReview);
  const { toast } = useToast();

  useEffect(() => {
    if (productDetails?.variants?.length > 0) {
      // default pilih varian dengan stok > 0
      const defaultVariant =
        productDetails.variants.find((v) => v.totalStock > 0) || productDetails.variants[0];
      setSelectedVariant(defaultVariant);
    }
    if (productDetails?._id) {
      dispatch(getReviews(productDetails._id));
    }
  }, [productDetails, dispatch]);

  // === ADD TO CART ===
  const handleAddToCart = () => {
    if (!selectedVariant) return;

    let sessionId = localStorage.getItem('sessionId');
    if (!user?.id && !sessionId) {
      sessionId = `guest-${uuidv4()}`;
      localStorage.setItem('sessionId', sessionId);
    }

    dispatch(
      addToCart({
        userId: user?.id || null, // jika guest bisa null
        productId: productDetails?._id,
        quantity: 1,
        variant: {
          name: selectedVariant.name,
          price: selectedVariant.salePrice > 0 ? selectedVariant.salePrice : selectedVariant.price,
        },
      })
    ).then((result) => {
      if (result.payload?.success) {
        toast({ title: 'Produk ditambahkan ke keranjang.' });
        // Refresh keranjang
        const id = user?.id || sessionId;
        dispatch(fetchCartItems(id));
      } else {
        toast({
          title: 'Gagal menambahkan ke keranjang.',
          variant: 'destructive',
        });
      }
    });
  };

  // === ADD REVIEW ===
  const handleAddReview = () => {
    if (!user?.id) {
      toast({ title: 'Anda harus login untuk menulis ulasan.', variant: 'destructive' });
      return;
    }

    dispatch(
      addReview({
        productId: productDetails?._id,
        userId: user._id,
        userName: user.userName,
        reviewMessage: reviewMsg,
        reviewValue: rating,
      })
    ).then((data) => {
      if (data.payload.success) {
        setRating(0);
        setReviewMsg('');
        dispatch(getReviews(productDetails?._id));
        toast({ title: 'Ulasan berhasil ditambahkan!' });
      }
    });
  };

  const handleDialogClose = () => {
    setOpen(false);
    dispatch(setProductDetails(null));
    setRating(0);
    setReviewMsg('');
    setSelectedVariant(null);
  };

  const averageReview =
    reviews && reviews.length > 0
      ? reviews.reduce((sum, item) => sum + item.reviewValue, 0) / reviews.length
      : 0;

  if (!productDetails) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] overflow-y-auto p-4 md:p-8 bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          {/* Kolom Gambar */}
          <div className="relative overflow-hidden rounded-lg aspect-square">
            <img
              src={productDetails.image}
              alt={productDetails.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Kolom Detail Produk */}
          <div className="flex flex-col space-y-4">
            <div>
              <p className="text-sm text-gray-500">{productDetails.category}</p>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                {productDetails.title}
              </h1>
              <p className="text-gray-600 text-base mt-2">{productDetails.description}</p>
            </div>

            {/* Pemilihan Varian */}
            <div className="pt-2 md:pt-4">
              <Label className="font-semibold text-gray-800">Pilih Varian:</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {productDetails.variants.map((variant) => (
                  <Button
                    key={variant.name}
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

            <div className="flex items-center gap-2">
              <StarRatingComponent rating={averageReview} />
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
                      <StarRatingComponent rating={review.reviewValue} />
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
              <StarRatingComponent rating={rating} handleRatingChange={setRating} />
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
      </DialogContent>
    </Dialog>
  );
}

export default ProductDetailsDialog;
