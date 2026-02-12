import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

const BannerSlider = () => {
    const [currentSlide, setCurrentSlide] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const timeoutRef = useRef(null);

    const banners = [
        {
            id: 1,
            title: "Hijaukan Ruangan",
            subtitle: "Dengan Tanaman Kami",
            description: "Temukan koleksi tanaman hias terbaik yang siap menghidupkan setiap sudut rumah Anda.",
            buttonText: "Belanja Sekarang",
            buttonLink: "/products",
            image: "https://images.unsplash.com/photo-1470058869958-2a77ade41c02?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
            bgColor: "bg-green-50"
        },
        {
            id: 2,
            title: "Promo Spesial",
            subtitle: "Benih Unggul",
            description: "Diskon hingga 50% untuk berbagai jenis benih tanaman buah dan sayur pilihan.",
            buttonText: "Lihat Promo",
            buttonLink: "/products?category=benih",
            image: "https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
            bgColor: "bg-emerald-50"
        },
        {
            id: 3,
            title: "Perawatan Mudah",
            subtitle: "Pupuk & Nutrisi",
            description: "Jaga tanaman kesayanganmu tetap subur dengan rangkaian produk perawatan terbaik kami.",
            buttonText: "Cek Produk",
            buttonLink: "/products?category=pupuk",
            image: "https://images.unsplash.com/photo-1585314062604-1a357de8b000?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80",
            bgColor: "bg-teal-50"
        }
    ];

    const resetTimeout = () => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };

    useEffect(() => {
        resetTimeout();
        timeoutRef.current = setTimeout(
            () => setCurrentSlide((prevIndex) =>
                prevIndex === banners.length - 1 ? 0 : prevIndex + 1
            ),
            5000
        );

        return () => resetTimeout();
    }, [currentSlide]);

    const nextSlide = () => {
        setCurrentSlide(currentSlide === banners.length - 1 ? 0 : currentSlide + 1);
    };

    const prevSlide = () => {
        setCurrentSlide(currentSlide === 0 ? banners.length - 1 : currentSlide - 1);
    };

    // Touch handlers for swipe
    const minSwipeDistance = 50;

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => {
        setTouchEnd(e.targetTouches[0].clientX);
    };

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;

        if (isLeftSwipe) {
            nextSlide();
        }
        if (isRightSwipe) {
            prevSlide();
        }
    };

    return (
        <div className="relative w-full overflow-hidden bg-gray-100 shadow-xl">
            {/* Main Slider Container with Aspect Ratio */}
            <div
                className="relative h-[400px] sm:h-[500px] md:h-[600px] w-full group overflow-hidden"
                onTouchStart={onTouchStart}
                onTouchMove={onTouchMove}
                onTouchEnd={onTouchEnd}
            >
                {/* Slides */}
                {banners.map((banner, index) => (
                    <div
                        key={banner.id}
                        className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                            }`}
                    >
                        {/* Background Image with Overlay */}
                        <div className="absolute inset-0 w-full h-full">
                            <img
                                src={banner.image}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-black/20 md:from-black/60 md:to-transparent"></div>
                        </div>

                        {/* Content */}
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full max-w-7xl mx-auto px-6 sm:px-12 md:px-16">
                                <div className={`max-w-xl space-y-4 md:space-y-6 transform transition-all duration-700 delay-300 ${index === currentSlide ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'
                                    }`}>
                                    <span className="inline-block px-3 py-1 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full text-green-300 text-xs md:text-sm font-semibold tracking-wider uppercase mb-2">
                                        {banner.subtitle}
                                    </span>

                                    <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
                                        {banner.title}
                                    </h2>

                                    <p className="text-gray-200 text-sm md:text-lg leading-relaxed max-w-lg">
                                        {banner.description}
                                    </p>

                                    <div className="pt-4">
                                        <Link
                                            to={banner.buttonLink}
                                            className="inline-flex items-center px-6 py-3 md:px-8 md:py-4 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition-all duration-300 transform hover:-translate-y-1 shadow-lg hover:shadow-green-500/30 gap-2"
                                        >
                                            {banner.buttonText}
                                            <FiChevronRight className="text-xl" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}



                {/* Dots Indicators */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex space-x-2 md:space-x-3">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${index === currentSlide
                                ? 'w-8 md:w-10 bg-green-500'
                                : 'w-2 md:w-3 bg-white/50 hover:bg-white'
                                }`}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default BannerSlider;
