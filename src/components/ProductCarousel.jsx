import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, useMotionValue, animate } from 'framer-motion';
import ProductCard from './ProductCard';
import { useProducts } from './ProductContext';

const ProductCarousel = () => {
    const { products } = useProducts();
    const [itemsToShow, setItemsToShow] = useState(3);
    const [isPaused, setIsPaused] = useState(false);
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const x = useMotionValue(0);

    // Filter for featured products only
    const featuredProducts = products ? products.filter(p => p.isFeatured === true) : [];
    // Ensure we have enough items for smoother infinite scroll
    const baseProducts = featuredProducts.slice(0, 10);
    const shouldAnimate = baseProducts.length >= itemsToShow;
    const duplicatedProducts = shouldAnimate ? [...baseProducts, ...baseProducts, ...baseProducts] : baseProducts;

    // Responsive items count
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 640) setItemsToShow(1.2);
            else if (window.innerWidth < 1024) setItemsToShow(2.5);
            else setItemsToShow(3);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Continuous Motion & Drag Logic
    useEffect(() => {
        if (!shouldAnimate || !contentRef.current) return;

        let controls;

        const animateScroll = () => {
            const contentWidth = contentRef.current ? contentRef.current.scrollWidth : 0;
            // duplicatedProducts has 3 sets. 
            const singleSetWidth = contentWidth / 3;

            if (singleSetWidth <= 0) return;

            // Infinite scroll reset logic
            if (x.get() <= -singleSetWidth) {
                x.set(0);
            }
            if (x.get() > 0) {
                x.set(-singleSetWidth);
            }

            // Animate one step
            controls = animate(x, x.get() - 1, {
                duration: 0.05,
                ease: "linear",
                onComplete: () => {
                    if (!isPaused) animateScroll();
                }
            });
        };

        if (!isPaused) {
            animateScroll();
        }

        return () => {
            if (controls) controls.stop();
        };
    }, [isPaused, shouldAnimate, x, itemsToShow]);

    const handleDragStart = () => {
        setIsPaused(true);
    };

    const handleDragEnd = () => {
        setIsPaused(false);
    };

    const scroll = (direction) => {
        const contentWidth = contentRef.current ? contentRef.current.scrollWidth : 0;
        const widthPerItem = contentWidth / duplicatedProducts.length;
        const scrollAmount = widthPerItem * Math.floor(itemsToShow);

        const current = x.get();
        let target = direction === 'left' ? current + scrollAmount : current - scrollAmount;

        animate(x, target, {
            type: "spring",
            stiffness: 300,
            damping: 30
        });
    };

    if (!products || products.length === 0) {
        return (
            <div className="h-40 flex items-center justify-center text-gray-500">
                No products available.
            </div>
        );
    }

    return (
        <div
            className="relative w-full group py-10"
            ref={containerRef}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
        >
            {/* Carousel Container */}
            <div className="overflow-hidden cursor-grab active:cursor-grabbing">
                <motion.div
                    ref={contentRef}
                    className="flex"
                    style={{ x }}
                    drag="x"
                    dragConstraints={{ right: 0, left: -((contentRef.current?.scrollWidth || 1000) * 0.6) }}
                    onDragStart={handleDragStart}
                    onDragEnd={handleDragEnd}
                >
                    {duplicatedProducts.map((product, index) => (
                        <div
                            key={`${product.id}-${index}`}
                            className="flex-shrink-0 px-4"
                            style={{ width: `${100 / itemsToShow}%` }}
                        >
                            <ProductCard product={product} />
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Navigation Arrows - Always Visible */}
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll('left'); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-4 bg-white/95 dark:bg-gray-800/95 rounded-full shadow-2xl border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-white transition-all duration-300 hover:bg-primary-600 hover:text-white hover:scale-110 active:scale-95"
                aria-label="Previous"
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); scroll('right'); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-4 bg-white/95 dark:bg-gray-800/95 rounded-full shadow-2xl border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-white transition-all duration-300 hover:bg-primary-600 hover:text-white hover:scale-110 active:scale-95"
                aria-label="Next"
            >
                <ChevronRight size={32} />
            </button>

            {/* Fade Overlays */}
            <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-white dark:from-black to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-white dark:from-black to-transparent z-10 pointer-events-none" />
        </div>
    );
};

export default ProductCarousel;
