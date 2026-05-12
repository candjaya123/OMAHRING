import { fetchProductById, clearCurrentProduct } from '@/store/admin/products-slice';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { addToCart, fetchCartItems } from '@/store/shop/cart-slice';
import useToast from '@/hooks/useToast';
import { ArrowLeft, ChevronLeft, ChevronRight, Package, ShieldCheck, Truck, ShoppingCart } from 'lucide-react';
import StarRatingComponent from '@/components/common/star-rating';
import { v4 as uuidv4 } from 'uuid';
import { setChatContext } from '@/store/shop/chat-slice';

function ProductDetailPage() {
  const { productId } = useParams();
  const dispatch = useDispatch();
  const toast = useToast();
  const navigate = useNavigate();

  const {
    currentProduct,
    isLoading: productLoading,
    error: productError,
  } = useSelector((state) => state.adminProducts);
  const { user } = useSelector((state) => state.auth);

  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const sessionId = localStorage.getItem('sessionId');

  useEffect(() => {
    window.scrollTo(0, 0);
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
    
    if (currentProduct) {
      dispatch(setChatContext({
        type: 'product',
        id: currentProduct.id || currentProduct.id,
        title: currentProduct.title,
        url: window.location.pathname
      }));
    }

    return () => {
      dispatch(setChatContext(null));
    };
  }, [currentProduct, dispatch]);

  const handleBack = () => {
    if (window.history.state && window.history.state.idx > 0) {
      navigate(-1);
    } else {
      navigate('/shop/listing');
    }
  };

  const images = currentProduct?.media?.images || [];
  const video = currentProduct?.media?.video;
  const allMedia = [...images, ...(video ? [video] : [])];

  const handleAddToCart = async () => {
    try {
      let currentSessionId = localStorage.getItem('sessionId');
      if (!user?.id && !currentSessionId) {
        currentSessionId = `guest-${uuidv4()}`;
        localStorage.setItem('sessionId', currentSessionId);
      }

      const cartData = {
        userId: user?.id || null,
        sessionId: user?.id ? null : currentSessionId,
        productId: currentProduct.id,
        quantity: selectedQuantity,
        variant: {
          name: selectedVariant.combination.join(' - '),
          price: selectedVariant.price,
          salePrice: selectedVariant.salePrice || 0,
        },
      };

      const result = await dispatch(addToCart(cartData));

      if (result.payload?.success) {
        toast.toastSuccess('Sukses', 'Berhasil ditambahkan ke keranjang!');
        dispatch(fetchCartItems(user?.id || currentSessionId));
      }
    } catch (error) {
      toast.toastError('Error', error.message || 'Terjadi Kesalahan');
    }
  };

  if (productLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-48 w-48 bg-gray-100 rounded-xl mb-4"></div>
          <p className="text-gray-500 font-medium">Memuat Detail Produk...</p>
        </div>
      </div>
    );
  }

  if (productError || !currentProduct) {
    return (
        <div className="flex justify-center items-center min-h-screen p-10">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold text-gray-800">{productError ? 'Terjadi Kesalahan' : 'Produk Tidak Ditemukan'}</h2>
            <Button onClick={() => navigate('/shop/listing')} className="bg-orange-500 hover:bg-orange-600">Kembali Belanja</Button>
          </div>
        </div>
    );
  }

  return (
    <div className="max-w-screen-xl mx-auto px-5 sm:px-10 py-8">
      <div className="mb-6">
        <Button variant="ghost" className="rounded-md gap-2 text-gray-500 hover:text-orange-600 pl-0 hover:bg-orange-50" onClick={handleBack}>
           <ArrowLeft className="w-4 h-4" /> Kembali ke Katalog
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Gallery */}
        <div className="lg:col-span-6 space-y-4">
           <div className="relative aspect-square bg-gray-50 rounded-xl overflow-hidden group select-none flex items-center justify-center border border-gray-100 min-h-[300px] md:min-h-[500px]">
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 text-gray-700 hover:text-orange-500 rounded-full shadow-sm disabled:opacity-0 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronLeft className="w-6 h-6"/>
                  </button>
                  <button 
                    disabled={currentImageIndex === allMedia.length - 1}
                    onClick={() => setCurrentImageIndex(prev => prev + 1)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 backdrop-blur-sm p-2 text-gray-700 hover:text-orange-500 rounded-full shadow-sm disabled:opacity-0 transition-all opacity-0 group-hover:opacity-100"
                  >
                    <ChevronRight className="w-6 h-6"/>
                  </button>
                </>
              )}
           </div>

           <div className="flex gap-3 overflow-x-auto no-scrollbar py-2">
              {allMedia.map((url, i) => (
                <div 
                  key={i} 
                  onClick={() => setCurrentImageIndex(i)}
                  className={`w-20 h-20 rounded-lg p-0.5 cursor-pointer shrink-0 transition-all bg-white ${currentImageIndex === i ? 'ring-2 ring-orange-500 shadow-sm' : 'ring-1 ring-gray-200 hover:ring-orange-300'}`}
                >
                  {i < images.length ? (
                    <img src={url} className="w-full h-full object-cover rounded-md" alt="thumb" />
                  ) : (
                    <div className="w-full h-full bg-gray-900 rounded-md flex items-center justify-center text-white text-[10px] font-bold">VIDEO</div>
                  )}
                </div>
              ))}
           </div>
        </div>

        {/* Content */}
        <div className="lg:col-span-6 flex flex-col space-y-6">
           <div className="space-y-3 pb-3 border-b border-gray-100">
              <div className="flex gap-2">
                {currentProduct.category?.map(c => <span key={c} className="text-[10px] bg-orange-50 border border-orange-100 text-orange-600 px-2.5 py-1 rounded-sm font-semibold uppercase tracking-wider">{c}</span>)}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">{currentProduct.title}</h1>
              <div className="flex items-center gap-3">
                <StarRatingComponent rating={4.8} />
                <span className="text-sm text-gray-500 font-medium">4.8 Rating &bull; 0 Terjual</span>
              </div>
           </div>

           <div className="space-y-1">
              <div className="flex items-baseline gap-3">
                  <span className="text-3xl md:text-4xl font-bold text-orange-600">
                    Rp {(selectedVariant?.salePrice || selectedVariant?.price || 0).toLocaleString('id-ID')}
                  </span>
                  {selectedVariant?.salePrice > 0 && (
                    <span className="text-lg line-through text-gray-400">
                      Rp {selectedVariant.price.toLocaleString('id-ID')}
                    </span>
                  )}
              </div>
              <p className="text-sm text-gray-500 font-medium flex items-center gap-2 pt-2">
                 Stok tersedia: {selectedVariant?.totalStock || 0} unit
              </p>
           </div>

           <div className="space-y-3 pt-2">
              <Label className="text-sm font-semibold text-gray-700 block">Pilih Variasi Produk</Label>
              <div className="flex flex-wrap gap-2.5">
                 {currentProduct.variants?.map((v, i) => (
                   <button
                     key={i}
                     onClick={() => setSelectedVariant(v)}
                     className={`h-11 px-5 rounded-md text-sm font-medium transition-colors border ${selectedVariant === v ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-300 bg-white text-gray-700 hover:border-orange-300 hover:bg-orange-50/50'}`}
                   >
                     {v.combination.join(' - ')}
                   </button>
                 ))}
              </div>
           </div>

           <div className="space-y-3">
              <Label className="text-sm font-semibold text-gray-700 block">Jumlah Pesanan</Label>
              <div className="flex items-center gap-4 bg-white w-fit p-1 rounded-md border border-gray-300">
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-sm hover:bg-gray-100 hover:text-orange-600 h-8 w-8"
                  onClick={() => setSelectedQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={selectedQuantity <= 1}
                >-</Button>
                <span className="w-10 text-center font-semibold text-gray-800">{selectedQuantity}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-sm hover:bg-gray-100 hover:text-orange-600 h-8 w-8"
                  onClick={() => setSelectedQuantity((prev) => Math.min(selectedVariant?.totalStock || 1, prev + 1))}
                  disabled={selectedQuantity >= (selectedVariant?.totalStock || 1)}
                >+</Button>
              </div>
           </div>

           <div className="grid grid-cols-2 gap-4 py-2">
              <div className="p-3 border border-gray-100 bg-gray-50/50 rounded-lg flex items-center gap-3">
                 <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><ShieldCheck className="w-4 h-4"/></div>
                 <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-medium">Garansi</span><span className="text-xs font-semibold text-gray-800">{currentProduct.attributes?.warrantyType || 'Resmi'}</span></div>
              </div>
              <div className="p-3 border border-gray-100 bg-gray-50/50 rounded-lg flex items-center gap-3">
                 <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600"><Truck className="w-4 h-4"/></div>
                 <div className="flex flex-col"><span className="text-[10px] text-gray-500 font-medium">Kurir</span><span className="text-xs font-semibold text-gray-800">Cepat & Aman</span></div>
              </div>
           </div>

           <Separator className="bg-gray-100" />

           <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-900 border-l-3 border-orange-500 pl-3">Deskripsi Produk</h3>
              <div 
                className="text-sm text-gray-600 leading-relaxed description-view pr-2"
                dangerouslySetInnerHTML={{ __html: currentProduct.description }}
              />
           </div>

           <div className="pt-4 mt-auto">
              <Button
                className="w-full h-14 rounded-lg bg-orange-500 hover:bg-orange-600 text-lg font-semibold text-white shadow-sm transition-colors"
                onClick={handleAddToCart}
                disabled={!selectedVariant || selectedVariant.totalStock === 0}
              >
                <ShoppingCart className="w-5 h-5 mr-3" />
                {selectedVariant?.totalStock === 0 ? 'Stok Habis' : 'Tambah ke Keranjang'}
              </Button>
           </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetailPage;
