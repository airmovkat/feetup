import { useState, useEffect } from 'react';
import HeroCarousel from '../components/HeroCarousel';
import ProductCarousel from '../components/ProductCarousel';
import { Link } from 'react-router-dom';
import { ShoppingBag, Truck, ShieldCheck, Heart, X, CheckCircle, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Reveal from '../components/Reveal';
import adImage from '../assets/ad.jpg';

const Home = () => {
    const [showAd, setShowAd] = useState(false);
    const [showWelcome, setShowWelcome] = useState(false);
    const [showAlreadyJoined, setShowAlreadyJoined] = useState(false);

    useEffect(() => {
        // Check if ad has already been shown in this window session (refresh resets it)
        if (!window.hasSeenHomeAd) {
            const timer = setTimeout(() => {
                setShowAd(true);
                window.hasSeenHomeAd = true;
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, []);

    const categories = [
        {
            name: "Men's",
            path: "/men",
            image: "https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=600&auto=format&fit=crop",
            count: "120+ Products"
        },
        {
            name: "Women's",
            path: "/women",
            image: "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?q=80&w=600&auto=format&fit=crop",
            count: "80+ Products"
        },
        {
            name: "Exclusive Sale",
            path: "/sale",
            image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600&auto=format&fit=crop",
            count: "Up to 50% Off"
        }
    ];

    const features = [
        { icon: <Truck size={24} />, title: "Fast Delivery", desc: "Across all major cities" },
        { icon: <ShieldCheck size={24} />, title: "Secure Checkout", desc: "100% safe transactions" },
        { icon: <Heart size={24} />, title: "Best Support", desc: "24/7 dedicated service" }
    ];

    return (
        <div className="bg-white dark:bg-black transition-colors duration-200">
            <HeroCarousel />

            {/* Features Bar */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-12 relative z-10">
                <Reveal className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {features.map((f, i) => (
                        <div key={i} className="group center-expand-card p-6 rounded-2xl shadow-xl flex items-center gap-4 border border-gray-100 dark:border-gray-800 transition-all duration-300">
                            <div className="bg-primary-50 dark:bg-primary-900/20 p-3 rounded-xl text-primary-600 dark:text-primary-400 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/40 transition-colors duration-300">
                                {f.icon}
                            </div>
                            <div>
                                <h3 className="font-bold text-gray-900 dark:text-white transition-colors duration-300">{f.title}</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 transition-colors duration-300">{f.desc}</p>
                            </div>
                        </div>
                    ))}
                </Reveal>
            </div>

            {/* Featured Products */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <Reveal>
                    <div className="text-center mb-10">
                        <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">Featured Products</h2>
                        <p className="mt-2 text-gray-500 dark:text-gray-400">Handpicked selections for your unique style.</p>
                    </div>
                </Reveal>
                <Reveal delay={0.4}>
                    <ProductCarousel />
                </Reveal>
            </div>

            {/* Shop by Category */}
            <div className="bg-gray-50 dark:bg-gray-950/50 py-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Reveal>
                        <div className="text-center mb-16">
                            <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white sm:text-4xl">Shop by Category</h2>
                            <p className="mt-4 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto">Explore our diverse collections designed for every occasion and lifestyle.</p>
                        </div>
                    </Reveal>
                    <Reveal delay={0.4} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {categories.map((cat, i) => (
                            <Link key={i} to={cat.path} className="group relative h-[450px] overflow-hidden rounded-3xl shadow-lg">
                                <img
                                    src={cat.image}
                                    alt={cat.name}
                                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                <div className="absolute bottom-8 left-8 right-8 text-white">
                                    <p className="text-primary-400 font-bold mb-1">{cat.count}</p>
                                    <h3 className="text-3xl font-extrabold mb-4">{cat.name}</h3>
                                    <div className="inline-flex items-center gap-2 bg-white text-black px-6 py-3 rounded-full font-bold group-hover:bg-primary-600 group-hover:text-white transition-all transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100">
                                        Shop Now <ShoppingBag size={18} />
                                    </div>
                                </div>
                            </Link>
                        ))}
                    </Reveal>
                </div>
            </div>

            {/* Newsletter Subscription */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
                <Reveal>
                    <div className="bg-primary-600 rounded-[3rem] p-12 relative overflow-hidden flex flex-col items-center text-center text-white">
                        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 bg-primary-500 rounded-full blur-3xl opacity-50" />
                        <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/2 w-96 h-96 bg-primary-700 rounded-full blur-3xl opacity-50" />

                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            className="relative z-10"
                        >
                            <h2 className="text-4xl md:text-5xl font-extrabold mb-6">Join the FeetUp Club</h2>
                            <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">Subscribe to get special offers, free giveaways, and once-in-a-lifetime deals.</p>
                            <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md mx-auto">
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const email = e.target.elements.email.value.trim();
                                        if (!email || !/\S+@\S+\.\S+/.test(email)) {
                                            alert('Please enter a valid email address.');
                                            return;
                                        }

                                        try {
                                            const res = await fetch('/api/newsletter/subscribe', {
                                                method: 'POST',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({ email })
                                            });
                                            const data = await res.json();

                                            // Rely on backend for duplicate check
                                            if (res.ok) {
                                                if (data.isNew) {
                                                    // Add to local storage just for persistence if needed, but not logic blocking
                                                    const currentList = JSON.parse(localStorage.getItem('feetup_club_emails') || '[]');
                                                    if (!currentList.some(item => item.email === email)) {
                                                        const newSub = { email, date: new Date().toISOString() };
                                                        localStorage.setItem('feetup_club_emails', JSON.stringify([newSub, ...currentList]));
                                                    }
                                                    // Trigger live update for other tabs (Admin Dashboard)
                                                    localStorage.setItem('newsletter_sync_event', Date.now());

                                                    setShowWelcome(true);
                                                    e.target.reset();
                                                } else {
                                                    setShowAlreadyJoined(true);
                                                }
                                            } else {
                                                alert(data.message || 'Subscription failed');
                                            }
                                        } catch (err) {
                                            console.error("Subscription error", err);
                                            alert("Something went wrong. Please try again.");
                                        }
                                    }}
                                    className="flex flex-col sm:flex-row gap-4 w-full"
                                >
                                    <input
                                        name="email"
                                        type="email"
                                        placeholder="Enter your email"
                                        className="flex-1 px-6 py-4 rounded-2xl bg-white/20 border border-white/30 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white transition-all"
                                    />
                                    <button type="submit" className="px-8 py-4 bg-white text-primary-600 font-bold rounded-2xl hover:bg-primary-50 transition-all active:scale-95">
                                        Join Now
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    </div>
                </Reveal>
            </div>

            {/* Advertisement Popup */}
            <AnimatePresence>
                {showAd && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAd(false)}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-md w-full bg-white dark:bg-gray-900 rounded-none overflow-hidden shadow-2xl"
                        >
                            {/* Close Button */}
                            <button
                                onClick={() => setShowAd(false)}
                                className="absolute top-0 right-0 z-10 p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-none shadow-lg transition-all active:scale-95"
                            >
                                <X size={20} />
                            </button>

                            {/* Ad Content */}
                            <div className="relative aspect-[4/5] w-full">
                                <img
                                    src={adImage}
                                    alt="Special Advertisement"
                                    className="h-full w-full object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6 right-6 text-white text-center">
                                    <h3 className="text-2xl font-bold mb-2">Exclusive Offer!</h3>
                                    <p className="text-sm text-gray-200">Don't miss out on our latest collection. Shop now for amazing discounts.</p>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Welcome Popup */}
            <AnimatePresence>
                {showWelcome && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowWelcome(false)}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-sm w-full bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl"
                        >
                            <button
                                onClick={() => setShowWelcome(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                                <CheckCircle size={40} />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Welcome!</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                Welcome to the FeetUp Club! You have successfully subscribed.
                            </p>

                            <button
                                onClick={() => setShowWelcome(false)}
                                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                Awesome!
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Already Joined Popup */}
            <AnimatePresence>
                {showAlreadyJoined && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowAlreadyJoined(false)}
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.5, opacity: 0 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                            className="relative max-w-sm w-full bg-white dark:bg-gray-800 rounded-2xl p-8 text-center shadow-2xl"
                        >
                            <button
                                onClick={() => setShowAlreadyJoined(false)}
                                className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors"
                            >
                                <X size={20} />
                            </button>

                            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-orange-600 dark:text-orange-400">
                                <AlertCircle size={40} />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Already Joined!</h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                You are already subscribed to the FeetUp Club.
                            </p>

                            <button
                                onClick={() => setShowAlreadyJoined(false)}
                                className="bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-8 rounded-xl transition-all shadow-lg active:scale-95"
                            >
                                Got it
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Home;
