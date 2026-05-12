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
import { addToCart, fetchCartItems } from '@/store/shop/cart-slice';
import { setProductDetails } from '@/store/shop/products-slice';
import { addReview, getReviews } from '@/store/shop/review-slice';
import { v4 as uuidv4 } from 'uuid';
import { ChevronLeft, ChevronRight, Package, ShieldCheck, Truck } from 'lucide-react';

function ProductDetailsDialog({ open, setOpen, productDetails }) {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [reviewMsg, setReviewMsg] = useState('');
  const [rating, setRating] = useState(0);

  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { reviews } = useSelector((state) => state.shopReview);
  const { toast } = useToast();

  useEffect(() => {
    if (productDetails?.variants?.length > 0) {
      setSelectedVariant(productDetails.variants[0]);
    }
    if (productDetails?.id) {
      dispatch(getReviews(productDetails.id));
    }
  }, [productDetails, dispatch]);

  const images = productDetails?.media?.images || [];
  const video = productDetails?.media?.video;
  const allMedia = [...images, ...(video ? [video] : [])];

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    let sessionId = localStorage.getItem('sessionId');
    if (!user?.id && !sessionId) {
      sessionId = `guest-${uuidv4()}`;
      localStorage.setItem('sessionId', sessionId);
    }

    dispatch(
      addToCart({
        userId: user?.id || null,
        sessionId: user?.id ? null : sessionId,
        productId: productDetails?.id,
        quantity: 1,
        variant: {
          name: selectedVariant.combination.join(' - '),
          price: selectedVariant.salePrice > 0 ? selectedVariant.salePrice : selectedVariant.price,
        },
      })
    ).then((result) => {
      if (result.payload?.success) {
        toast({ title: 'Ditambahkan ke keranjang' });
        dispatch(fetchCartItems(user?.id || sessionId));
      }
    });
  };

  const handleAddReview = () => {
    if (!user?.id) {
      toast({ title: 'Login diperlukan', variant: 'destructive' });
      return;
    }
    dispatch(addReview({
      productId: productDetails?.id,
      userId: user.id,
      userName: user.userName,
      reviewMessage: reviewMsg,
      reviewValue: rating,
    })).then((data) => {
      if (data.payload.success) {
        setRating(0);
        setReviewMsg('');
        dispatch(getReviews(productDetails?.id));
      }
    });
  };

  const handleDialogClose = () => {
    setOpen(false);
    dispatch(setProductDetails(null));
    setCurrentImageIndex(0);
  };

  if (!productDetails) return null;

  return (
    <Dialog open={open} onOpenChange={handleDialogClose}>
      <DialogContent className="max-w-5xl w-[95vw] max-h-[90vh] overflow-y-auto p-0 bg-white grid grid-cols-1 md:grid-cols-12 gap-0 overflow-x-hidden rounded-xl">
        {/* Gallery Section */}
        <div className="md:col-span-6 bg-gray-50 flex flex-col relative">
          <div className="flex-1 relative group bg-gray-100 flex items-center justify-center min-h-[300px] md:min-h-[400px]">
            {currentImageIndex < images.length ? (
              <img src={allMedia[currentImageIndex]} className="max-h-full object-contain mx-auto mix-blend-multiply" alt="Preview" />
            ) : (
              <video src={video} className="w-full h-full object-cover" controls autoPlay muted />
            )}
            
            {allMedia.length > 1 && (
              <>
                <button 
                  disabled={currentImageIndex === 0}
                  onClick={() => setCurrentImageIndex(prev => prev - 1)}
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 text-gray-700 hover:text-orange-500 rounded-full shadow-sm disabled:opacity-0 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5"/>
                </button>
                <button 
                  disabled={currentImageIndex === allMedia.length - 1}
                  onClick={() => setCurrentImageIndex(prev => prev + 1)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 text-gray-700 hover:text-orange-500 rounded-full shadow-sm disabled:opacity-0 transition-colors"
                >
                  <ChevronRight className="w-5 h-5"/>
                </button>
              </>
            )}
          </div>
          
          <div className="p-4 flex gap-3 overflow-x-auto no-scrollbar bg-white border-t border-gray-100">
            {allMedia.map((url, i) => (
              <div 
                key={i} 
                onClick={() => setCurrentImageIndex(i)}
                className={`w-16 h-16 rounded-md p-0.5 cursor-pointer shrink-0 bg-white transition-all ${currentImageIndex === i ? 'ring-2 ring-orange-500' : 'ring-1 ring-gray-200 hover:ring-orange-300'}`}
              >
                {i < images.length ? (
                  <img src={url} className="w-full h-full object-cover rounded-sm" />
                ) : (
                  <div className="w-full h-full bg-gray-900 rounded-sm flex items-center justify-center text-white text-[9px] font-bold">VIDEO</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Content Section */}
        <div className="md:col-span-6 p-6 lg:p-8 flex flex-col space-y-5 overflow-y-auto bg-white">
          <div className="space-y-2">
            <div className="flex gap-2">
              {productDetails.category?.map(c => <span key={c} className="text-[10px] bg-orange-50 text-orange-600 px-2.5 py-1 rounded-sm font-semibold uppercase tracking-wider">{c}</span>)}
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 leading-snug">{productDetails.title}</h1>
            <div className="flex items-center gap-2 pt-1 border-b border-gray-100 pb-3">
              <StarRatingComponent rating={4.5} />
              <span className="text-xs text-gray-500 font-medium">4.5 Rating &bull; 0 Terjual</span>
            </div>
          </div>

          <div className="space-y-1 py-1">
             <div className="flex items-baseline gap-2">
                <span className="text-3xl font-bold text-orange-600">
                  Rp {(selectedVariant?.salePrice || selectedVariant?.price || 0).toLocaleString('id-ID')}
                </span>
                {selectedVariant?.salePrice > 0 && (
                  <span className="text-sm line-through text-gray-400">
                    Rp {selectedVariant.price.toLocaleString('id-ID')}
                  </span>
                )}
             </div>
             <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 pt-1">
                Stok tersedia: {selectedVariant?.totalStock || 0}
             </p>
          </div>

          <div className="space-y-3 pt-2">
             <Label className="text-xs font-semibold text-gray-700 block">Pilih Variasi Produk</Label>
             <div className="flex flex-wrap gap-2.5">
                {productDetails.variants?.map((v, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedVariant(v)}
                    className={`h-10 px-4 rounded-md text-xs font-medium transition-colors border ${selectedVariant === v ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/50'}`}
                  >
                    {v.combination.join(' - ')}
                  </button>
                ))}
             </div>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="p-3 border border-gray-100 rounded-lg flex items-center gap-3 bg-gray-50/50">
               <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><ShieldCheck className="w-4 h-4"/></div>
               <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-medium">Garansi</span><span className="text-xs font-bold text-gray-800">{productDetails.attributes?.warrantyType || 'Tidak Ada'}</span></div>
            </div>
            <div className="p-3 border border-gray-100 rounded-lg flex items-center gap-3 bg-gray-50/50">
               <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><Truck className="w-4 h-4"/></div>
               <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-medium">Pengiriman</span><span className="text-xs font-bold text-gray-800">Cepat & Aman</span></div>
            </div>
          </div>

          <Separator className="bg-gray-100" />

          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900">Deskripsi Produk</h3>
            <div 
              className="text-sm text-gray-600 leading-relaxed max-h-[250px] overflow-y-auto description-view pr-2"
              dangerouslySetInnerHTML={{ __html: productDetails.description }}
            />
          </div>

          <div className="sticky bottom-0 bg-white pt-4 pb-2 border-t border-gray-100 mt-auto">
            <Button
              className="w-full h-12 rounded-lg bg-orange-500 hover:bg-orange-600 text-base font-semibold text-white shadow-sm transition-colors"
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.totalStock === 0}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {selectedVariant?.totalStock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ProductDetailsDialog;
