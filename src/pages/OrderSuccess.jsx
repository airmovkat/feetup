import { useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import confetti from 'canvas-confetti';

import { useCurrency } from '../components/CurrencyContext';
import { sendOrderConfirmation } from '../utils/emailService';

const OrderSuccess = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { state } = location;
    const { formatPrice } = useCurrency();
    const emailSent = useRef(false);

    useEffect(() => {
        // Send Order Confirmation Email
        if (state?.customer?.email && state?.orderId) {
            const emailStorageKey = `feetup_email_sent_${state.orderId}`;
            const alreadySent = sessionStorage.getItem(emailStorageKey);

            if (!alreadySent && !emailSent.current) {
                emailSent.current = true;
                sessionStorage.setItem(emailStorageKey, 'true');

                // Format currency symbol if it's an object, otherwise use as is
                const currencySymbol = typeof state.currency === 'object' ? state.currency.symbol : state.currency;

                sendOrderConfirmation({
                    orderId: state.orderId,
                    customer: state.customer,
                    items: state.items,
                    total: state.total,
                    currency: currencySymbol || '$', // Fallback to $ if undefined
                    exchangeRate: state.exchangeRate // Pass dynamic rate
                }).then(result => {
                    if (result.success) {
                        console.log("Order confirmation email sent to:", state.customer.email);
                    } else {
                        console.error("Failed to send order confirmation email");
                        // Optional: remove key if failed so they can try again? 
                        // sessionStorage.removeItem(emailStorageKey); 
                        // But usually better to fail silently than spam on retry loops.
                    }
                });
            } else {
                console.log("Email already sent for this session/order.");
            }
        }

        // Trigger confetti
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        const random = (min, max) => Math.random() * (max - min) + min;

        const interval = setInterval(() => {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: random(0.1, 0.3), y: Math.random() - 0.2 }
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: random(0.7, 0.9), y: Math.random() - 0.2 }
            });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    // Redirect if direct access without state (optional)
    useEffect(() => {
        if (!state?.customer) {
            // You might want to redirect back to home if no order data,
            // but for now we'll just let them see the page generic
        }
    }, [state, navigate]);

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, type: 'spring', stiffness: 100 }}
                className="mb-8"
            >
                <div className="rounded-full bg-green-100 dark:bg-green-900/30 p-6">
                    <CheckCircle className="w-24 h-24 text-green-600 dark:text-green-500" />
                </div>
            </motion.div>

            <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
            >
                <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4">
                    Order Placed Successfully!
                </h1>
                <p className="text-lg text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto">
                    Thank you {state?.customer?.name ? `, ${state.customer.name}` : ''} for your purchase.
                    We have received your order and are getting it ready!
                </p>

                <div className="bg-white dark:bg-gray-800 p-8 rounded-2xl max-w-2xl mx-auto mb-8 text-left shadow-xl border border-gray-100 dark:border-gray-700 relative overflow-hidden">
                    <div className="absolute top-0 right-0 bg-primary-600 text-white px-4 py-1 rounded-bl-xl font-bold text-sm">
                        {state?.orderId || '#ORD-UNKNOWN'}
                    </div>

                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 border-b border-gray-100 dark:border-gray-700 pb-2">Order Summary</h3>

                    <div className="space-y-4 mb-6">
                        {state?.items?.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 p-3 rounded-lg">
                                <div className="flex items-center gap-3">
                                    <div className="relative">
                                        <img src={item.image} alt={item.name} className="w-12 h-12 rounded object-cover border border-gray-200 dark:border-gray-700" />
                                        <span className="absolute -top-2 -right-2 bg-gray-900 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">x{item.quantity}</span>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">{item.name}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                            Size: {item.size} {item.color && <>| Color: <span className="text-gray-900 dark:text-white font-medium">{item.color}</span> </>}
                                        </p>
                                        <p className="text-xs text-primary-600 font-medium mt-0.5">
                                            {formatPrice(item.price)} each
                                        </p>
                                    </div>
                                </div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</p>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 dark:border-gray-700">
                        <div className="text-left">
                            <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Delivery Details</h4>
                            <p className="text-sm font-bold text-gray-900 dark:text-white">{state?.customer?.name}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{state?.customer?.address}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">{state?.customer?.city}, {state?.customer?.zip}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{state?.customer?.phone}</p>
                        </div>
                        <div className="flex flex-col justify-between">
                            <div className="text-left md:text-right mb-4">
                                <h4 className="text-xs font-black uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-2">Payment Info</h4>
                                <p className="text-sm font-bold text-green-600">Cash on Delivery</p>
                            </div>

                            {/* Totals Section */}
                            <div className="pt-4 border-t border-gray-100 dark:border-gray-700 mt-auto space-y-2">
                                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                    <span>Subtotal</span>
                                    <span className="font-bold">{formatPrice(state?.total || 0)}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                                    <span>Shipping</span>
                                    <span className="font-bold text-green-600">
                                        {formatPrice(500 / (state?.exchangeRate || 300))}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center gap-4 text-lg font-black dark:text-white uppercase tracking-tighter pt-2 border-t border-gray-200 dark:border-gray-700">
                                    <span>Grand Total</span>
                                    <span className="text-primary-600">
                                        {formatPrice((state?.total || 0) + (500 / (state?.exchangeRate || 300)))}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        to="/"
                        className="inline-flex items-center justify-center px-10 py-4 border border-transparent text-lg font-black uppercase tracking-widest rounded-xl text-white bg-primary-600 hover:bg-primary-700 transition-all shadow-2xl hover:shadow-primary-500/40 active:scale-95"
                    >
                        Back to Shop
                        <ArrowRight className="ml-2 w-6 h-6" />
                    </Link>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderSuccess;
