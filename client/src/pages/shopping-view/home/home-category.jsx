import { Card, CardContent } from '@/components/ui/card';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Home, Wheat, Sparkles, Bird, Circle } from 'lucide-react';

const categoriesWithIcon = [
  { id: 'burung', label: 'Burung', icon: Bird },
  { id: 'kandang', label: 'Kandang', icon: Home },
  { id: 'pakan', label: 'Pakan', icon: Wheat },
  { id: 'ring-burung', label: 'Ring Burung', icon: Circle },
  { id: 'aksesoris', label: 'Aksesoris', icon: Sparkles },
];

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

export const HomeCategory = () => {
  const navigate = useNavigate();
  function handleNavigateToListingPage(getCurrentItem, section) {
    sessionStorage.removeItem('filters');
    const currentFilter = {
      [section]: [getCurrentItem.id],
    };
    sessionStorage.setItem('filters', JSON.stringify(currentFilter));
    navigate(`/shop/listing`);
  }

  return (
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
  );
};
