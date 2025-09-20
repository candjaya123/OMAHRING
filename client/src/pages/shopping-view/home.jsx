import { Button } from '@/components/ui/button';
import {
  Bird,
  Home,
  Wheat,
  Circle,
  Sparkles,
  Feather,
  Heart,
  Flower,
  Sparkle,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRight,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllFilteredProducts, fetchProductDetails } from '@/store/shop/products-slice';
import ShoppingProductTile from '@/components/shopping-view/product-tile';
import { useNavigate } from 'react-router-dom';
import { addToCart, fetchCartItems } from '@/store/shop/cart-slice';
import { useToast } from '@/components/ui/use-toast';
import ProductDetailsDialog from '@/components/shopping-view/product-details';
import { getFeatureImages } from '@/store/common-slice';
import { motion } from 'framer-motion';

// --- Data ---
const categoriesWithIcon = [
  { id: 'Burung', label: 'Burung', icon: Bird },
  { id: 'Kandang', label: 'Kandang', icon: Home },
  { id: 'Pakan', label: 'Pakan', icon: Wheat },
  { id: 'Ring-Burung', label: 'Ring Burung', icon: Circle },
  { id: 'Aksesoris', label: 'Aksesoris', icon: Sparkles },
];

const brandsWithIcon = [
  { id: 'avian', label: 'Avian', icon: Feather },
  { id: 'sangkarjaya', label: 'Sangkar Jaya', icon: Home },
  { id: 'nutribird', label: 'NutriBird', icon: Wheat },
  { id: 'birdcare', label: 'BirdCare', icon: Heart },
  { id: 'flory', label: 'Flory', icon: Flower },
  { id: 'avitron', label: 'Avitron', icon: Sparkle },
];

const events = [
  {
    id: 'event1',
    title: 'Kontes Burung Kicau Nasional 2025',
    date: '10 November 2025',
    location: 'Jakarta',
    description: 'Bergabunglah dengan kontes burung kicau terbesar di Indonesia!',
  },
  {
    id: 'event2',
    title: 'Pameran Kandang Burung Inovatif',
    date: '15 Desember 2025',
    location: 'Bandung',
    description: 'Lihat desain kandang terbaru dan teknologi perawatan burung.',
  },
  {
    id: 'event3',
    title: 'Workshop Pakan Burung',
    date: '20 Oktober 2025',
    location: 'Surabaya',
    description: 'Pelajari cara memilih pakan terbaik untuk burung Anda.',
  },
];

// Varian animasi untuk section
const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
    },
  },
};

function ShoppingHome() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { productList, productDetails } = useSelector((state) => state.shopProducts);
  const { featureImageList } = useSelector((state) => state.commonFeature);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const { user } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  // --- Fungsi-fungsi ---
  function handleNavigateToListingPage(getCurrentItem, section) {
    sessionStorage.removeItem('filters');
    const currentFilter = {
      [section]: [getCurrentItem.id],
    };
    sessionStorage.setItem('filters', JSON.stringify(currentFilter));
    navigate(`/shop/listing`);
  }

  function handleGetProductDetails(getCurrentProductId) {
    dispatch(fetchProductDetails(getCurrentProductId));
  }

  function handleAddtoCart(getCurrentProductId) {
    dispatch(
      addToCart({
        userId: user?.id,
        productId: getCurrentProductId,
        quantity: 1,
      })
    ).then((data) => {
      if (data?.payload?.success) {
        dispatch(fetchCartItems(user?.id));
        toast({
          title: 'Produk ditambahkan ke keranjang',
          className: 'bg-orange-500 text-white',
        });
      }
    });
  }

  // --- Hooks ---
  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true);
  }, [productDetails]);

  useEffect(() => {
    // slideshow dipindahkan ke hero section atau komponen lain jika masih diperlukan
  }, [featureImageList]);

  useEffect(() => {
    dispatch(
      fetchAllFilteredProducts({
        filterParams: {},
        sortParams: 'price-lowtohigh',
      })
    );
    dispatch(getFeatureImages());
  }, [dispatch]);

  return (
    <div className="flex flex-col min-h-screen bg-[#FDFCFB] text-gray-800 font-sans">
      {/* Hero Section */}
      <section className="relative h-[70vh] min-h-[500px] flex items-center text-white">
        <div className="absolute inset-0 bg-black/50 z-10"></div>
        {/* Ganti dengan gambar berkualitas tinggi yang relevan dengan brand Anda */}
        <img
          src="https://images.unsplash.com/photo-1555169062-013468b47731?q=80&w=1974&auto=format&fit=crop"
          alt="Burung eksotis di habitat alami"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8 text-center"
        >
          <h1 className="text-4xl md:text-6xl font-serif font-bold mb-4 text-shadow">
            Omahring - Ring Berkualitas untuk Sang Juara
          </h1>
          <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8 text-shadow-sm">
            Temukan ring burung premium, pakan bernutrisi, dan aksesoris terbaik yang dirancang
            untuk menunjang performa dan keindahan burung kesayangan Anda.
          </p>
          <Button
            onClick={() => handleNavigateToListingPage({ id: 'Ring-Burung' }, 'category')}
            className="bg-orange-500 text-white hover:bg-orange-600 text-lg px-8 py-3 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
          >
            Jelajahi Koleksi Ring <ArrowRight className="inline-block ml-2 w-5 h-5" />
          </Button>
        </motion.div>
      </section>
      {/* Slideshow Section */}
      <div className="relative w-full h-[600px] overflow-hidden">
        {featureImageList && featureImageList.length > 0 ? (
          featureImageList.map((slide, index) => (
            <img
              src={slide?.image}
              key={index}
              className={`${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              } absolute top-0 left-0 w-full h-full object-cover transition-opacity duration-700 ease-in-out`}
              alt={`Banner ${index + 1}`}
            />
          ))
        ) : (
          <div className="w-full h-full bg-gray-200 flex items-center justify-center">
            <p className="text-gray-500 text-lg">Tidak ada banner tersedia</p>
          </div>
        )}
        <Button
          variant="outline"
          size="icon"
          onClick={() =>
            setCurrentSlide(
              (prevSlide) => (prevSlide - 1 + featureImageList.length) % featureImageList.length
            )
          }
          className="absolute top-1/2 left-4 transform -translate-y-1/2 bg-white/90 hover:bg-orange-500 hover:text-white transition-colors duration-300"
          aria-label="Slide sebelumnya"
        >
          <ChevronLeftIcon className="w-5 h-5" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setCurrentSlide((prevSlide) => (prevSlide + 1) % featureImageList.length)}
          className="absolute top-1/2 right-4 transform -translate-y-1/2 bg-white/90 hover:bg-orange-500 hover:text-white transition-colors duration-300"
          aria-label="Slide berikutnya"
        >
          <ChevronRightIcon className="w-5 h-5" />
        </Button>
      </div>

      {/* Category Section */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-20 bg-white"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 text-center mb-4">
            Belanja Berdasarkan Kategori
          </h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            Temukan semua kebutuhan hobi Anda dengan mudah, mulai dari pakan hingga aksesoris
            esensial.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-8">
            {categoriesWithIcon.map((categoryItem) => (
              <motion.div
                key={categoryItem.id}
                whileHover={{ y: -8 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <Card
                  onClick={() => handleNavigateToListingPage(categoryItem, 'category')}
                  className="cursor-pointer border border-gray-100 shadow-sm hover:shadow-xl transition-shadow duration-400 bg-white rounded-lg group"
                >
                  <CardContent className="flex flex-col items-center justify-center p-8">
                    <categoryItem.icon className="w-12 h-12 mb-4 text-orange-500 transition-transform duration-400 group-hover:scale-110" />
                    <span className="text-lg font-medium text-gray-700">{categoryItem.label}</span>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Featured Products Section */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-20 bg-[#F7F5F2]"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-800 text-center mb-4">
            Produk Pilihan Kami
          </h2>
          <p className="text-center text-gray-500 mb-16 max-w-xl mx-auto">
            Produk terlaris yang menjadi favorit para kicau mania di seluruh Indonesia.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {productList && productList.length > 0 ? (
              productList
                .slice(0, 4)
                .map((productItem) => (
                  <ShoppingProductTile
                    key={productItem.id}
                    handleGetProductDetails={handleGetProductDetails}
                    product={productItem}
                    handleAddtoCart={handleAddtoCart}
                  />
                ))
            ) : (
              <p className="text-center text-gray-600 col-span-full text-lg">
                Tidak ada produk tersedia
              </p>
            )}
          </div>
          <div className="text-center mt-16">
            <Button
              variant="outline"
              onClick={() => navigate(`/shop/listing`)}
              className="border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white text-lg px-8 py-3 rounded-full transition-colors duration-300"
            >
              Lihat Semua Produk
            </Button>
          </div>
        </div>
      </motion.section>

      <section className="py-16 bg-gradient-to-r from-orange-50 to-orange-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-800 text-center mb-12">
            Acara Burung
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map((event) => (
              <Card
                key={event.id}
                className="border-none shadow-md hover:shadow-lg transition-all duration-300 bg-white hover:bg-orange-50 transform hover:-translate-y-1"
              >
                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold text-gray-800 mb-3">{event.title}</h3>
                  <p className="text-sm text-orange-500 mb-2">
                    {event.date} | {event.location}
                  </p>
                  <p className="text-gray-600">{event.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
      {/* CTA Join Membership Section */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-20 bg-white"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gray-800 rounded-lg shadow-xl p-10 md:p-16 text-center flex flex-col items-center">
            <Sparkles className="w-12 h-12 text-orange-400 mb-4" />
            <h2 className="text-3xl md:text-4xl font-serif font-semibold text-white mb-4">
              Jadi Bagian dari Komunitas Eksklusif Omahring
            </h2>
            <p className="text-lg text-gray-300 max-w-xl mx-auto mb-8">
              Dapatkan akses prioritas ke produk terbaru, diskon khusus anggota, dan undangan ke
              acara-acara komunitas pecinta burung.
            </p>
            <Button
              onClick={() => navigate('/shop/membership')}
              className="bg-orange-500 text-white hover:bg-orange-600 text-lg px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all transform hover:scale-105"
            >
              Daftar Keanggotaan
            </Button>
          </div>
        </div>
      </motion.section>
      {/* Product Details Dialog */}
      <ProductDetailsDialog
        open={openDetailsDialog}
        setOpen={setOpenDetailsDialog}
        productDetails={productDetails}
      />
    </div>
  );
}

export default ShoppingHome;
