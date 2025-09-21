import { useState, useEffect } from 'react';
import { ArrowRight, Star, Users, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomeHero = () => {
  const heroImages = [
    {
      url: 'https://images.unsplash.com/photo-1555169062-013468b47731?q=80&w=1974&auto=format&fit=crop',
      alt: 'Burung eksotis di habitat alami',
      title: 'Ring Berkualitas untuk Sang Juara',
      subtitle:
        'Temukan ring burung premium, pakan bernutrisi, dan aksesoris terbaik yang dirancang untuk menunjang performa dan keindahan burung kesayangan Anda.',
    },
    {
      url: 'https://images.unsplash.com/photo-1520808663317-647b476a81b9?q=80&w=1173&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      alt: 'Burung cantik dengan ring premium',
      title: 'Aksesoris Premium untuk Burung Terbaik',
      subtitle:
        'Koleksi lengkap ring, pakan, dan peralatan berkualitas tinggi dari brand terpercaya untuk burung kesayangan Anda.',
    },
    {
      url: 'https://images.unsplash.com/photo-1624974553444-acf86b019000?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
      alt: 'Burung tropis yang indah',
      title: 'Nutrisi Terbaik untuk Performa Optimal',
      subtitle:
        'Pakan bernutrisi lengkap dan suplemen khusus yang diformulasikan untuk meningkatkan kesehatan dan performa burung lomba.',
    },
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  const nextSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev + 1) % heroImages.length);
        setIsAnimating(false);
      }, 300);
    }
  };

  const prevSlide = () => {
    if (!isAnimating) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length);
        setIsAnimating(false);
      }, 300);
    }
  };

  return (
    <section className="relative h-[85vh] min-h-[600px] flex items-center text-white overflow-hidden">
      {heroImages.map((image, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-all duration-1000 ease-in-out ${
            index === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
          }`}
        >
          <img
            src={image.url}
            alt={image.alt}
            className="absolute inset-0 w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/30"></div>
        </div>
      ))}

      <button
        onClick={prevSlide}
        className="absolute left-6 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110"
        disabled={isAnimating}
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        onClick={nextSlide}
        className="absolute right-6 top-1/2 transform -translate-y-1/2 z-30 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all duration-300 hover:scale-110"
        disabled={isAnimating}
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div className="container relative z-20 mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div
            className={`transition-all duration-700 ${
              isAnimating ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0'
            }`}
          >
            <div className="inline-flex items-center gap-2 bg-orange-500/20 backdrop-blur-sm border border-orange-300/30 rounded-full px-4 py-2 mb-6">
              <Award className="w-4 h-4 text-orange-300" />
              <span className="text-orange-200 text-sm font-medium">
                Trusted by 10,000+ Bird Enthusiasts
              </span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
              <span className="block text-white drop-shadow-lg">Omahring</span>
              <span className="block text-orange-400 text-2xl md:text-3xl lg:text-4xl font-medium mt-2">
                {heroImages[currentSlide].title}
              </span>
            </h1>

            <p className="text-lg md:text-xl text-gray-200 max-w-xl mb-8 leading-relaxed drop-shadow-sm">
              {heroImages[currentSlide].subtitle}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Link
                to="/shop/listing"
                className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 hover:shadow-xl flex items-center justify-center gap-2 group"
              >
                Jelajahi Koleksi Ring
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <button className="border-2 border-white/30 hover:bg-white/10 backdrop-blur-sm text-white font-semibold px-8 py-4 rounded-full transition-all duration-300 hover:border-white/50">
                Pelajari Lebih Lanjut
              </button>
            </div>

            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <span className="text-gray-300">4.9/5 Rating</span>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-gray-300" />
                <span className="text-gray-300">10,000+ Customers</span>
              </div>
            </div>
          </div>

          <div
            className={`hidden lg:block transition-all duration-700 delay-200 ${
              isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
            }`}
          >
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
              <h3 className="text-xl font-bold mb-4 text-white">Mengapa Memilih Omahring?</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-white">Kualitas Premium</h4>
                    <p className="text-gray-300 text-sm">
                      Ring dan aksesoris berkualitas tinggi dari material terbaik
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-white">Pengiriman Cepat</h4>
                    <p className="text-gray-300 text-sm">
                      Delivery ke seluruh Indonesia dengan packaging aman
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-orange-400 rounded-full mt-2 flex-shrink-0"></div>
                  <div>
                    <h4 className="font-semibold text-white">Konsultasi Gratis</h4>
                    <p className="text-gray-300 text-sm">
                      Tim ahli siap membantu memilih produk terbaik
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 z-30 flex gap-3">
        {heroImages.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              if (!isAnimating) {
                setIsAnimating(true);
                setTimeout(() => {
                  setCurrentSlide(index);
                  setIsAnimating(false);
                }, 300);
              }
            }}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide ? 'bg-orange-400 w-8' : 'bg-white/40 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </section>
  );
};

{
  /* <section className="relative h-[80vh] min-h-[500px] flex items-center text-white">
        <div className="absolute inset-0 bg-black/50 z-10"></div>
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
      </section> */
}
