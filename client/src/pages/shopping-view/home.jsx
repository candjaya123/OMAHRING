import { Button } from '@/components/ui/button';
import { Home, Wheat, Sparkles, Feather, Heart, Flower, Sparkle, Loader2, Send, Plus, ArrowRight, Bird, ShieldCheck, QrCode } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchAllFilteredProducts } from '@/store/shop/products-slice';
import ShoppingProductTile from '@/components/shopping-view/product-tile';
import { useNavigate } from 'react-router-dom';
import { getFeatureImages } from '@/store/common-slice';
import { motion } from 'framer-motion';
import { HomeHero } from './home/home-hero';
import { HomeSlideshow } from './home/home-slideshow';
import { HomeCategory } from './home/home-category';
import { fetchArticles, joinCommunity } from '@/store/shop/common-slice';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { productList } = useSelector((state) => state.shopProducts);
  const { articleList } = useSelector((state) => state.shopCommon);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [communityForm, setCommunityForm] = useState({ name: '', email: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    dispatch(
      fetchAllFilteredProducts({
        filterParams: {},
        sortParams: 'price-lowtohigh',
      })
    );
    dispatch(getFeatureImages());
    dispatch(fetchArticles());
  }, [dispatch]);

  const handleJoinCommunity = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const result = await dispatch(joinCommunity(communityForm)).unwrap();
      if (result.success) {
        toast({ title: "Berhasil!", description: result.message });
        setCommunityForm({ name: '', email: '' });
      }
    } catch (error) {
      toast({ title: "Gagal", description: "Terjadi kesalahan saat mendaftar.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#FCFAF8] text-gray-900 font-sans selection:bg-orange-100 italic-none">
      <HomeHero />
      <HomeSlideshow />
      <HomeCategory />

      {/* 2. Product Section */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-24 bg-gradient-to-b from-[#FCFAF8] to-[#F5F2EF]"
      >
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16 space-y-4">
             <div className="inline-block px-4 py-1.5 bg-orange-100 text-orange-600 rounded-full text-xs font-black uppercase tracking-widest">
                {t('sections.products')}
             </div>
             <h2 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 tracking-tight">
               {t('sections.featured_products')}
             </h2>
          </div>

          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 lg:gap-10"
          >
            {productList && productList.length > 0 ? (
              productList
                .slice(0, 4)
                .map((productItem) => (
                  <motion.div key={productItem.id} variants={itemVariants}>
                    <ShoppingProductTile product={productItem} />
                  </motion.div>
                ))
            ) : (
              <div className="col-span-full text-center py-20 bg-white/50 rounded-3xl border border-dashed border-gray-200">
                <p className="text-gray-400 italic">{t('product.no_product')}</p>
              </div>
            )}
          </motion.div>

          <div className="text-center mt-20">
            <Button
              onClick={() => navigate(`/shop/listing`)}
              className="bg-gray-900 hover:bg-black text-white text-lg px-12 py-7 h-auto rounded-2xl shadow-2xl shadow-gray-200 transition-all duration-300 transform hover:-translate-y-1 active:scale-95 font-bold"
            >
              {t('product.see_all')}
            </Button>
          </div>
        </div>
      </motion.section>

      {/* 3. Bird Champion Info Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-serif font-bold text-gray-900 mb-4">
              {t('sections.bird_champion')}
            </h2>
            <p className="text-gray-500 max-w-2xl mx-auto">
              Lihat riwayat kemenangan dan profil burung-burung juara yang menggunakan produk Omahring.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Placeholder for Champion Birds */}
            {[1, 2, 3].map((i) => (
              <Card key={i} className="rounded-3xl overflow-hidden border-none shadow-xl hover:shadow-2xl transition-shadow">
                <div className="h-64 bg-gray-100 relative">
                  <div className="absolute top-4 left-4 bg-orange-500 text-white px-3 py-1 rounded-full text-xs font-bold uppercase">Champion</div>
                </div>
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold mb-2">Nama Burung #{i}</h3>
                  <p className="text-sm text-gray-500 mb-4">Jenis: Murai Batu</p>
                  <Button variant="outline" className="w-full rounded-xl">Lihat Profil</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Membership Section */}
      <motion.section
        variants={sectionVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="py-32 bg-gray-800 relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-full">
           <div className="absolute -top-1/4 -right-1/4 w-[600px] h-[600px] bg-orange-600/10 rounded-full blur-[120px] animate-pulse"></div>
           <div className="absolute -bottom-1/4 -left-1/4 w-[600px] h-[600px] bg-orange-900/10 rounded-full blur-[120px]"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-10 xl:gap-24">
            <div className="flex-1 text-left space-y-8">
              <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 text-orange-400 px-6 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.2em]">
                <Sparkles className="w-4 h-4 fill-orange-400" /> {t('sections.membership')}
              </div>
              <h2 className="text-5xl md:text-7xl font-serif font-bold text-white leading-[1.1] tracking-tight">
                {t('membership.benefits')}
              </h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-6 gap-x-12 pt-4">
                {[
                  { label: t('membership.discount'), icon: <Sparkles className="w-5 h-5 text-orange-400" /> },
                  { label: t('membership.register'), icon: <Bird className="w-5 h-5 text-orange-400" /> },
                  { label: t('membership.branding'), icon: <ShieldCheck className="w-5 h-5 text-orange-400" /> },
                  { label: t('membership.barcode'), icon: <QrCode className="w-5 h-5 text-orange-400" /> },
                ].map((item, idx) => (
                  <div key={idx} className="flex gap-4 items-center group">
                    <div className="w-12 h-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center shrink-0 group-hover:bg-orange-500 transition-all">
                      {item.icon}
                    </div>
                    <div>
                       <h4 className="font-bold text-white text-sm uppercase tracking-wider">{item.label}</h4>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex-1 w-full lg:max-w-lg">
              <div className="bg-white/5 backdrop-blur-2xl rounded-[3rem] p-10 md:p-14 border border-white/10">
                <h3 className="text-3xl font-bold text-white mb-6 text-center">{t('auth.register')}</h3>
                <form onSubmit={handleJoinCommunity} className="space-y-6">
                  <Input
                    required
                    placeholder="Nama Lengkap"
                    value={communityForm.name}
                    onChange={(e) => setCommunityForm({ ...communityForm, name: e.target.value })}
                    className="bg-black/40 border-none text-white h-16 rounded-2xl px-6"
                  />
                  <Input
                    required
                    type="email"
                    placeholder="Email"
                    value={communityForm.email}
                    onChange={(e) => setCommunityForm({ ...communityForm, email: e.target.value })}
                    className="bg-black/40 border-none text-white h-16 rounded-2xl px-6"
                  />
                  <Button type="submit" className="w-full h-16 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-lg">
                    {isSubmitting ? <Loader2 className="animate-spin" /> : t('auth.register')}
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 5. Education & Info Section (Last) */}
      <section className="py-28 bg-white overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-end justify-between mb-16 gap-6">
            <div className="max-w-2xl space-y-4">
              <h2 className="text-4xl md:text-6xl font-serif font-bold text-gray-900 tracking-tight">
                {t('sections.education')}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {articleList && articleList.length > 0 ? (
              articleList.slice(0, 3).map((article) => (
                <Card key={article.id} onClick={() => navigate('/shop/blog')} className="rounded-[2.5rem] overflow-hidden cursor-pointer group border-none shadow-md hover:shadow-2xl transition-all">
                  <div className="aspect-[16/11] overflow-hidden">
                    <img src={article.image || '/placeholder-article.jpg'} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                  </div>
                  <CardContent className="p-8">
                    <h3 className="text-2xl font-bold mb-4 group-hover:text-orange-600 transition-colors">{article.title}</h3>
                    <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-100">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{t('common.read_more')}</span>
                      <ArrowRight className="w-4 h-4 text-gray-300 group-hover:translate-x-2 transition-all" />
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="col-span-full text-center py-20 bg-gray-50 rounded-[2.5rem]">
                <p className="text-gray-400 italic">Belum ada informasi terbaru.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

export default ShoppingHome;
