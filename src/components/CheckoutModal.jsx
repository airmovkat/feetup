import { useState, useEffect } from 'react';
import { X, LogIn } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useCurrency } from './CurrencyContext';
import { useNotification } from './NotificationContext';

const CheckoutModal = ({ isOpen, onClose, onSubmit, total }) => {
    const { user, registeredUsers } = useAuth();
    const { formatPrice } = useCurrency();
    const { showNotification } = useNotification();
    const navigate = useNavigate();
    const [isLoginPromptOpen, setIsLoginPromptOpen] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        zip: ''
    });

    useEffect(() => {
        if (isOpen && user) {
            setFormData({
                name: user.name || '',
                phone: user.phone || '',
                email: user.email || '',
                address: user.address || '',
                city: user.city || '',
                zip: user.zip || ''
            });
        }
    }, [isOpen, user]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Guest Checkout Validation
        if (!user) {
            try {
                // Server-side check for existing account
                const res = await fetch('/api/users/check-email', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: formData.email })
                });
                const data = await res.json();

                if (data.exists) {
                    setIsLoginPromptOpen(true);
                    return;
                }
            } catch (err) {
                console.error("Email check failed", err);
                // Optionally block or allow proceed on error. Allowing proceed to avoid blocking sales on network glitch.
            }
        }

        onSubmit(formData);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleLoginRedirect = () => {
        setIsLoginPromptOpen(false);
        onClose(); // Close checkout modal
        navigate('/login');
    };

    return (
        <>
            <AnimatePresence>
                {isLoginPromptOpen && (
                    <div className="fixed inset-0 bg-black/60 z-[70] flex items-center justify-center p-4 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-gray-100 dark:border-gray-700 relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-orange-400 to-red-500" />

                            <div className="w-20 h-20 bg-orange-100 dark:bg-orange-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                                <LogIn size={40} className="text-orange-500" />
                            </div>

                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
                                Account Found!
                            </h3>

                            <p className="text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
                                It looks like <strong>{formData.email}</strong> is already registered with us. Please log in to continue with your purchase.
                            </p>

                            <div className="flex flex-col gap-3">
                                <button
                                    type="button"
                                    onClick={handleLoginRedirect}
                                    className="w-full py-3.5 px-6 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg shadow-orange-500/30 transition-all transform hover:scale-[1.02] flex items-center justify-center gap-2"
                                >
                                    <LogIn size={20} />
                                    <span>Log In Now</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setIsLoginPromptOpen(false)}
                                    className="w-full py-3.5 px-6 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 flex flex-col max-h-[90vh]">
                        {/* Fixed Header */}
                        <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-gray-700 shrink-0">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Checkout Details</h2>
                            <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                                <X size={24} />
                            </button>
                        </div>

                        {/* Scrollable Content */}
                        <div className="p-6 overflow-y-auto flex-1">
                            <div className="mb-6 bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg flex justify-between items-center">
                                <span className="text-sm text-primary-800 dark:text-primary-200 font-medium">Total Amount (COD)</span>
                                <span className="text-lg font-bold text-primary-700 dark:text-primary-300">{formatPrice(total)}</span>
                            </div>

                            <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                                    <input
                                        type="text"
                                        name="name"
                                        required
                                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 border focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                        <input
                                            type="tel"
                                            name="phone"
                                            required
                                            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 border focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            value={formData.phone}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input
                                            type="email"
                                            name="email"
                                            autoComplete="off"
                                            required
                                            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 border focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            value={formData.email}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                                    <textarea
                                        name="address"
                                        required
                                        rows="2"
                                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 border focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
                                        <input
                                            type="text"
                                            name="city"
                                            required
                                            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 border focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            value={formData.city}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ZIP Code</label>
                                        <input
                                            type="text"
                                            name="zip"
                                            required
                                            className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-2 border focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none transition-all"
                                            value={formData.zip}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Fixed Footer */}
                        <div className="p-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                            <div className="flex space-x-3">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="flex-1 px-4 py-3 text-sm font-bold text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600 shadow-sm"
                                >
                                    Cancel
                                </button>
                                <motion.button
                                    type="submit"
                                    form="checkout-form"
                                    whileHover={{ backgroundColor: '#ea580c' }} // Dark orange on hover
                                    transition={{ duration: 0.2 }}
                                    className="flex-1 px-4 py-3 text-sm font-bold text-white bg-orange-500 rounded-lg shadow-lg shadow-orange-500/30 transition-all font-sans"
                                >
                                    Place Order
                                </motion.button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default CheckoutModal;
