import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Gift } from 'lucide-react';
import { useAuth } from './AuthContext';

const BroadcastPopup = () => {
    const [offer, setOffer] = useState(null);
    const { user } = useAuth();

    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === 'marketing_broadcast') {
                try {
                    const newOffer = e.newValue ? JSON.parse(e.newValue) : null;
                    // Only show if user is logged in (active)
                    if (newOffer && user) {
                        // Check if this is a fresh offer (timestamp check could go here)
                        setOffer(newOffer);
                    }
                } catch (err) {
                    console.error('Error parsing broadcast offer', err);
                }
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [user]);

    const handleClaim = () => {
        // Here you would typically add logic to apply the discount
        // For now, we'll just close it or show a success state
        // alert(`Generic Code Activated: ${offer.code || 'SAVE20'}`);
        setOffer(null);
    };

    return (
        <AnimatePresence>
            {offer && (
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none"
                >
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" />

                    <motion.div
                        initial={{ y: 50 }}
                        animate={{ y: 0 }}
                        className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full relative pointer-events-auto overflow-hidden border-2 border-primary-100 dark:border-primary-900"
                    >
                        {/* Decorative Background */}
                        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-primary-100 dark:bg-primary-900/30 rounded-full blur-2xl" />

                        <button
                            onClick={() => setOffer(null)}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <div className="flex flex-col items-center text-center relative z-10">
                            <div className="w-16 h-16 bg-primary-50 dark:bg-primary-900/30 rounded-full flex items-center justify-center mb-4 text-primary-600 dark:text-primary-400">
                                <Gift size={32} />
                            </div>

                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                                Exclusive Offer!
                            </h3>

                            <p className="text-gray-600 dark:text-gray-300 mb-6">
                                {offer.message}
                            </p>

                            <button
                                onClick={handleClaim}
                                className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-xl transition-all shadow-lg shadow-primary-500/30 hover:shadow-primary-500/50 active:scale-95"
                            >
                                Claim Now
                            </button>
                        </div>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default BroadcastPopup;
