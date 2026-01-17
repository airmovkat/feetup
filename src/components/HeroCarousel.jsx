import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const SLIDES = [
    {
        id: 1,
        image: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?q=80&w=1920&auto=format&fit=crop",
        title: "New Season Arrivals",
        subtitle: "Step into the future of comfort.",
        cta: "Shop Men's",
        path: "/men"
    },
    {
        id: 2,
        image: "https://images.unsplash.com/photo-1595341888016-a392ef81b7de?q=80&w=1920&auto=format&fit=crop",
        title: "Run Further",
        subtitle: "Engineered for your personal best.",
        cta: "Shop Running",
        path: "/sale"
    },
    {
        id: 3,
        image: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=1920&auto=format&fit=crop",
        title: "Urban Collection",
        subtitle: "Style that moves with you.",
        cta: "Shop Women's",
        path: "/women"
    }
];

const HeroCarousel = () => {
    const [current, setCurrent] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrent((prev) => (prev + 1) % SLIDES.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    const nextSlide = () => setCurrent((prev) => (prev + 1) % SLIDES.length);
    const prevSlide = () => setCurrent((prev) => (prev === 0 ? SLIDES.length - 1 : prev - 1));

    return (
        <div className="relative h-[600px] w-full overflow-hidden bg-gray-900">
            <AnimatePresence mode="wait">
                <motion.div
                    key={current}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute inset-0"
                >
                    <div
                        className="absolute inset-0 bg-cover bg-center"
                        style={{ backgroundImage: `url(${SLIDES[current].image})` }}
                    >
                        <div className="absolute inset-0 bg-black/40" />
                    </div>

                    <div className="relative h-full flex items-center justify-center text-center px-4">
                        <div className="max-w-3xl">
                            <motion.h1
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-5xl md:text-7xl font-bold text-white mb-6 tracking-tight"
                            >
                                {SLIDES[current].title}
                            </motion.h1>
                            <motion.p
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-xl md:text-2xl text-gray-200 mb-8"
                            >
                                {SLIDES[current].subtitle}
                            </motion.p>
                            <motion.div
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.6 }}
                            >
                                <Link
                                    to={SLIDES[current].path}
                                    className="inline-block px-8 py-4 bg-white text-gray-900 rounded-full font-bold text-lg hover:bg-primary-500 hover:text-white transition-colors duration-300 shadow-lg hover:shadow-primary-500/25"
                                >
                                    {SLIDES[current].cta}
                                </Link>
                            </motion.div>
                        </div>
                    </div>
                </motion.div>
            </AnimatePresence>

            <button
                onClick={prevSlide}
                className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
            >
                <ChevronLeft size={32} />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-sm transition-colors"
            >
                <ChevronRight size={32} />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex space-x-2">
                {SLIDES.map((_, index) => (
                    <button
                        key={index}
                        onClick={() => setCurrent(index)}
                        className={`w-2.5 h-2.5 rounded-full transition-all ${index === current ? "bg-white w-8" : "bg-white/50"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

export default HeroCarousel;
