import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';

const CategorySlider = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [visibleItems, setVisibleItems] = useState(4);
  const sliderRef = useRef(null);

  const categories = [
  {
    id: 1,
    name: 'Benih-Benih',
    image: 'https://ycwcbxbytdtmluzalofn.supabase.co/storage/v1/object/public/products/benih-cabai.png',
    description: 'Benih tanaman berkualitas',
    link: '/products?category=benih',
    color: 'bg-green-500'
  },
  {
    id: 2,
    name: 'Pupuk',
    image: 'https://ycwcbxbytdtmluzalofn.supabase.co/storage/v1/object/public/products/pupuk-organik.png',
    description: 'Pupuk organik & kimia',
    link: '/products?category=pupuk',
    color: 'bg-yellow-500'
  },
  {
    id: 3,
    name: 'Tanaman',
    image: 'https://ycwcbxbytdtmluzalofn.supabase.co/storage/v1/object/public/products/anggrek-bulan.png',
    description: 'Berbagai jenis tanaman',
    link: '/products?category=tanaman',
    color: 'bg-purple-500'
  },
  {
    id: 4,
    name: 'Pot',
    image: 'https://ycwcbxbytdtmluzalofn.supabase.co/storage/v1/object/public/products/pot-keramik.png',
    description: 'Berbagai jenis pot',
    link: '/products?category=pot',
    color: 'bg-red-500'
  },
];

  // Calculate visible items based on screen size
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 640) {
        setVisibleItems(2);
      } else if (window.innerWidth < 1024) {
        setVisibleItems(3);
      } else {
        setVisibleItems(4);
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto slide
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex >= Math.ceil(categories.length / visibleItems) - 1 ? 0 : prevIndex + 1
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, categories.length, visibleItems]);

  const nextSlide = () => {
    const maxIndex = Math.ceil(categories.length / visibleItems) - 1;
    setCurrentIndex(currentIndex >= maxIndex ? 0 : currentIndex + 1);
  };

  const prevSlide = () => {
    const maxIndex = Math.ceil(categories.length / visibleItems) - 1;
    setCurrentIndex(currentIndex === 0 ? maxIndex : currentIndex - 1);
  };

  const goToSlide = (index) => {
    setCurrentIndex(index);
  };

  // Calculate translateX based on current index and visible items
  const translateX = currentIndex * (100 / visibleItems) * visibleItems;

  return (
    <section className="py-8 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header dengan tombol navigasi di kanan */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Kategori Pilihan</h2>
            <div className="w-20 h-1 bg-green-500"></div>
          </div>
          
          {/* Tombol Navigasi */}
          <div className="flex space-x-2">
            <button
              onClick={prevSlide}
              className="bg-white border border-gray-300 rounded-lg p-2 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-300"
              aria-label="Previous category"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={nextSlide}
              className="bg-white border border-gray-300 rounded-lg p-2 hover:bg-green-500 hover:text-white hover:border-green-500 transition-all duration-300"
              aria-label="Next category"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Slider Container */}
        <div 
          className="relative"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}
        >
          {/* Slider Content */}
          <div className="overflow-hidden">
            <div 
              ref={sliderRef}
              className="flex transition-transform duration-500 ease-in-out"
              style={{ transform: `translateX(-${translateX}%)` }}
            >
              {categories.map((category, index) => (
                <div 
                  key={category.id} 
                  className={`flex-shrink-0 px-2 ${
                    visibleItems === 2 ? 'w-1/2' : 
                    visibleItems === 3 ? 'w-1/3' : 'w-1/4'
                  }`}
                >
                  <Link
                    to={category.link}
                    className="block group"
                  >
                    <div className="bg-white rounded-lg border border-gray-200 hover:border-green-500 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
                      {/* Category Image */}
                      <div className="h-32 bg-gray-200 flex items-center justify-center overflow-hidden">
                        {category.image ? (
                          <img 
                            src={category.image} 
                            alt={category.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                        ) : (
                          <span className="text-3xl text-gray-400">
                            {category.name === 'Benih-Benih' && '🌱'}
                            {category.name === 'Pupuk' && '🧪'}
                            {category.name === 'Tanaman' && '🌿'}
                            {category.name === 'Pot' && '🏺'}
                          </span>
                        )}
                      </div>
                      
                      {/* Category Info */}
                      <div className="p-4 text-center">
                        <h3 className="text-sm font-semibold text-gray-800 mb-1 group-hover:text-green-600 transition-colors">
                          {category.name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          {category.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Dots Indicator */}
          <div className="flex justify-center mt-6 space-x-2">
            {Array.from({ length: Math.ceil(categories.length / visibleItems) }).map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex 
                    ? 'bg-green-500 w-6' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* View All Button */}
        <div className="text-center mt-6">
          <Link
            to="/products"
            className="inline-flex items-center text-green-600 hover:text-green-700 font-medium text-sm transition-colors"
          >
            Lihat Semua Kategori
            <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CategorySlider;