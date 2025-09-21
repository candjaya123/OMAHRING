import { Button } from '@/components/ui/button';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

export const HomeSlideshow = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const { featureImageList } = useSelector((state) => state.commonFeature);
  useEffect(() => {}, [featureImageList]);

  return (
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
  );
};
