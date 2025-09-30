import ProductFilter from '@/components/shopping-view/filter';
import ProductDetailsDialog from '@/components/shopping-view/product-details';
import ShoppingProductTile from '@/components/shopping-view/product-tile';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { sortOptions } from '@/config';
import { fetchAllFilteredProducts } from '@/store/shop/products-slice';
import { getFeatureImages } from '@/store/common-slice';
import { ArrowUpDownIcon, ChevronLeftIcon, ChevronRightIcon, Sparkles } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';

function createSearchParamsHelper(filterParams) {
  const queryParams = [];

  for (const [key, value] of Object.entries(filterParams)) {
    if (Array.isArray(value) && value.length > 0) {
      const paramValue = value.join(',');
      queryParams.push(`${key}=${encodeURIComponent(paramValue)}`);
    }
  }

  return queryParams.join('&');
}

const sectionVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' } },
};

function ShoppingListing() {
  const dispatch = useDispatch();
  const { productList, productDetails } = useSelector((state) => state.shopProducts);
  const { featureImageList } = useSelector((state) => state.commonFeature);
  const [filters, setFilters] = useState({});
  const [sort, setSort] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const navigate = useNavigate();

  const categorySearchParam = searchParams.get('category');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  function handleSort(value) {
    setSort(value);
  }

  function handleFilter(getSectionId, getCurrentOption) {
    let cpyFilters = { ...filters };
    const indexOfCurrentSection = Object.keys(cpyFilters).indexOf(getSectionId);

    if (indexOfCurrentSection === -1) {
      cpyFilters = {
        ...cpyFilters,
        [getSectionId]: [getCurrentOption],
      };
    } else {
      const indexOfCurrentOption = cpyFilters[getSectionId].indexOf(getCurrentOption);

      if (indexOfCurrentOption === -1) cpyFilters[getSectionId].push(getCurrentOption);
      else cpyFilters[getSectionId].splice(indexOfCurrentOption, 1);
    }

    setFilters(cpyFilters);
    sessionStorage.setItem('filters', JSON.stringify(cpyFilters));
  }

  useEffect(() => {
    setSort('price-lowtohigh');
    setFilters(JSON.parse(sessionStorage.getItem('filters')) || {});
  }, [categorySearchParam]);

  useEffect(() => {
    if (filters && Object.keys(filters).length > 0) {
      const createQueryString = createSearchParamsHelper(filters);
      setSearchParams(new URLSearchParams(createQueryString));
    }
  }, [filters]);

  useEffect(() => {
    if (filters !== null && sort !== null)
      dispatch(fetchAllFilteredProducts({ filterParams: filters, sortParams: sort }));
  }, [dispatch, sort, filters]);

  useEffect(() => {
    if (productDetails !== null) setOpenDetailsDialog(true);
  }, [productDetails]);

  useEffect(() => {
    dispatch(getFeatureImages());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prevSlide) => (prevSlide + 1) % featureImageList.length);
    }, 12000);
    return () => clearInterval(timer);
  }, [featureImageList]);

  return (
    <div className="flex flex-col">
      {/* Slideshow Section */}
      <div className="relative w-full h-[400px] overflow-hidden">
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

      {/* Product Listing Section */}
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6 p-4 md:p-6">
        <ProductFilter filters={filters} handleFilter={handleFilter} />
        <div className="bg-background w-full rounded-lg shadow-sm">
          <div className="p-4 border-b flex items-center justify-between">
            <h2 className="text-lg font-extrabold text-gray-800">Semua Produk</h2>
            <div className="flex items-center gap-3">
              <span className="text-muted-foreground">{productList?.length} Produk</span>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 border-gray-300 hover:bg-orange-500 hover:text-white transition-colors duration-300"
                  >
                    <ArrowUpDownIcon className="h-4 w-4" />
                    <span>Urutkan</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  className="w-[200px] bg-white border-gray-200 shadow-md"
                >
                  <DropdownMenuRadioGroup value={sort} onValueChange={handleSort}>
                    {sortOptions.map((sortItem, index) => (
                      <DropdownMenuRadioItem
                        value={sortItem.id}
                        key={index}
                        className="text-gray-800 hover:bg-orange-50 hover:text-orange-500 transition-colors duration-300"
                      >
                        {sortItem.label}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {productList && productList.length > 0 ? (
              productList.map((productItem) => (
                <ShoppingProductTile key={productItem._id} product={productItem} />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">Tidak ada produk tersedia</p>
            )}
          </div>
        </div>
      </div>

      <ProductDetailsDialog
        open={openDetailsDialog}
        setOpen={setOpenDetailsDialog}
        productDetails={productDetails}
      />

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
    </div>
  );
}

export default ShoppingListing;
