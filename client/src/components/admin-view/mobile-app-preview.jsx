import { ShoppingCart, Heart, Share2, ChevronLeft, Star } from 'lucide-react';

function MobileAppPreview({ data }) {
  const mainImage = data.media?.images?.[0] || '';
  
  return (
    <div className="sticky top-6 flex flex-col items-center">
      <h3 className="text-sm font-semibold mb-3 text-gray-500 uppercase tracking-wider">
        Real-time Mobile Preview
      </h3>
      
      {/* Phone Case Frame */}
      <div className="w-[300px] h-[600px] bg-white border-[10px] border-gray-800 rounded-[2.5rem] shadow-xl relative overflow-hidden flex flex-col pointer-events-none select-none">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-gray-800 rounded-b-xl z-20 flex justify-center items-center pb-1">
          <div className="w-10 h-1.5 bg-gray-900 rounded-full"></div>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto no-scrollbar pt-8">
          {/* Header */}
          <div className="flex justify-between items-center px-4 py-2 text-gray-800">
            <ChevronLeft className="w-6 h-6" />
            <div className="flex gap-4">
              <Share2 className="w-5 h-5" />
              <ShoppingCart className="w-5 h-5" />
            </div>
          </div>

          {/* Product Image */}
          <div className="aspect-square bg-gray-50 relative">
            {mainImage ? (
              <img src={mainImage} className="w-full h-full object-cover" alt="Preview" />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                <ShoppingCart className="w-12 h-12 mb-2" />
                <span className="text-[10px]">No Product Image</span>
              </div>
            )}
            
            {/* Pagination dots simulation */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gray-300/80 rounded-full"></div>
              <div className="w-1.5 h-1.5 bg-gray-300/80 rounded-full"></div>
            </div>
          </div>

          {/* Product Details */}
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-orange-600 font-bold text-lg">
                Rp {data.variants?.[0]?.salePrice > 0 ? data.variants?.[0]?.salePrice?.toLocaleString('id-ID') : (data.variants?.[0]?.price?.toLocaleString('id-ID') || 0)}
              </span>
              <Heart className="w-5 h-5 text-gray-300" />
            </div>

            <div className="space-y-1">
              <h1 className="font-medium text-sm text-gray-800 line-clamp-2 leading-snug">
                {data.title || "Nama produk Omahring akan tampil di sini..."}
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center bg-gray-100 px-1 rounded text-[10px] font-medium text-gray-600">
                  <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                  <span className="ml-0.5">0.0</span>
                </div>
                <span className="text-[10px] text-gray-500">Terjual 0+</span>
              </div>
            </div>

            {/* Variation Preview */}
            {data.variationOptions?.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-gray-100">
                {data.variationOptions.map((opt, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <span className="text-[10px] font-semibold text-gray-500 uppercase">{opt.name || "Variation"}</span>
                    <div className="flex flex-wrap gap-2">
                      {opt.options?.map((val, vIdx) => (
                        <div key={vIdx} className="px-3 py-1 border border-gray-200 text-gray-700 rounded text-[10px] bg-gray-50 uppercase">
                          {val}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Description Preview */}
            <div className="space-y-1 pt-2 border-t border-gray-100">
              <span className="text-[10px] font-semibold text-gray-500 uppercase">Deskripsi Produk</span>
              <div 
                className="text-[10px] text-gray-600 line-clamp-4 leading-relaxed overflow-hidden"
                dangerouslySetInnerHTML={{ __html: data.description || "Belum ada deskripsi..." }}
              />
            </div>
          </div>
        </div>

        {/* Footer / CTA Buffer */}
        <div className="h-12 border-t border-gray-100 flex items-center px-4 gap-2 bg-white">
          <div className="flex-1 border border-orange-500 h-8 rounded flex items-center justify-center text-[10px] font-bold text-orange-500">
            Chat Penjual
          </div>
          <div className="flex-[1.5] bg-orange-500 h-8 rounded flex items-center justify-center text-[10px] font-bold text-white shadow-sm">
            Beli Sekarang
          </div>
        </div>
      </div>
      
      <p className="text-[10px] text-gray-400 mt-4 italic text-center max-w-[250px]">
        *Tampilan simulasi mobile khusus Shop View.
      </p>
    </div>
  );
}

export default MobileAppPreview;
