import { Button } from '@/components/ui/button';
import { Home, Wheat, Sparkles, Feather, Heart, Flower, Sparkle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllFilteredProducts } from '@/store/shop/products-slice';
import ShoppingProductTile from '@/components/shopping-view/product-tile';
import { useNavigate } from 'react-router-dom';
import { getFeatureImages } from '@/store/common-slice';
import { motion } from 'framer-motion';
import { HomeHero } from './home/home-hero';
import { HomeSlideshow } from './home/home-slideshow';
import { HomeCategory } from './home/home-category';

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
  const { productList } = useSelector((state) => state.shopProducts);
  const dispatch = useDispatch();
  const navigate = useNavigate();

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
      <HomeHero />
      <HomeSlideshow />
      <HomeCategory />

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
                  <ShoppingProductTile key={productItem._id} product={productItem} />
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
    </div>
  );
}

export default ShoppingHome;
