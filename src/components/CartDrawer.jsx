import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Minus, Plus, ShoppingBag } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';
import { useOrders } from './OrderContext';
import { useCurrency } from './CurrencyContext';
import { useProducts } from './ProductContext';
import { useNotification } from './NotificationContext';
import CheckoutModal from './CheckoutModal';

const CartDrawer = () => {
    const { isCartOpen, toggleCart, cart, updateQuantity, removeFromCart, clearCart, cartTotal } = useCart();
    const { addOrder } = useOrders();
    const { updateStockForOrder, products } = useProducts();
    const { showNotification } = useNotification();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const navigate = useNavigate();

    const { currency, formatPrice, exchangeRate } = useCurrency(); // Import formatPrice and exchangeRate

    const handleCheckout = async (formData) => {
        const orderData = {
            customer: formData,
            items: cart,
            total: cartTotal,
            currency: currency // Store currency with order for record
        };
        const newOrder = await addOrder(orderData);

        if (newOrder) {
            updateStockForOrder(cart);

            console.log("Order Submitted:", orderData);
            clearCart();
            setIsCheckoutOpen(false);
            toggleCart();
            navigate('/order-success', {
                state: {
                    orderId: newOrder.id,
                    customer: formData,
                    total: cartTotal,
                    currency,
                    exchangeRate, // Pass the current rate
                    items: cart
                }
            });
        }
    };

    return (
        <>
            <AnimatePresence>
                {isCartOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={toggleCart}
                            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
                        />

                        {/* Drawer */}
                        <motion.div
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                            className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white dark:bg-gray-900 shadow-2xl flex flex-col"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                                    <ShoppingBag className="mr-3" />
                                    Your Cart
                                </h2>
                                <button
                                    onClick={toggleCart}
                                    className="p-2 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                >
                                    <X size={24} />
                                </button>
                            </div>

                            {cart.length > 0 && (
                                <div className="px-6 py-2 bg-gray-50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-800 flex justify-end">
                                    <button
                                        onClick={clearCart}
                                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center"
                                    >
                                        <span className="mr-1">Clear Cart</span>
                                        <X size={14} />
                                    </button>
                                </div>
                            )}

                            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                                {cart.length === 0 ? (
                                    <div className="text-center py-12">
                                        <ShoppingBag size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                                        <p className="text-gray-500 dark:text-gray-400 text-lg">Your cart is empty</p>
                                        <button
                                            onClick={toggleCart}
                                            className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                                        >
                                            Start Shopping
                                        </button>
                                    </div>
                                ) : (
                                    cart.map((item) => (
                                        <div key={`${item.id}-${item.size}-${item.color || 'nocolor'}`} className="flex space-x-4">
                                            <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-md border border-gray-200 dark:border-gray-700">
                                                <img
                                                    src={item.image}
                                                    alt={item.name}
                                                    className="h-full w-full object-cover object-center"
                                                />
                                            </div>

                                            <div className="flex flex-1 flex-col">
                                                <div>
                                                    <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white">
                                                        <h3>{item.name}</h3>
                                                        <p className="ml-4">{formatPrice(item.price * item.quantity)}</p>
                                                    </div>
                                                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{item.category} {item.color && <span className="text-xs border border-gray-200 dark:border-gray-600 px-1.5 py-0.5 rounded ml-2">{item.color}</span>}</p>
                                                    {item.code && <p className="text-xs font-mono text-gray-400 dark:text-gray-500 mt-0.5">{item.code}</p>}
                                                </div>
                                                <div className="flex flex-1 items-end justify-between text-sm">
                                                    <div className="flex items-center space-x-2 border border-gray-200 dark:border-gray-700 rounded-lg p-1">
                                                        <button
                                                            onClick={() => updateQuantity(item.id, item.size, item.color, item.quantity - 1)}
                                                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
                                                        >
                                                            <Minus size={14} />
                                                        </button>
                                                        <span className="font-medium w-4 text-center dark:text-white">{item.quantity}</span>
                                                        <button
                                                            onClick={() => {
                                                                const product = products?.find(p => p.id === item.id);
                                                                const stock = product ? (product.stock !== undefined ? product.stock : 50) : 50;
                                                                const currentTotal = cart.filter(c => c.id === item.id).reduce((sum, c) => sum + c.quantity, 0);

                                                                if (currentTotal >= stock) {
                                                                    showNotification(`Max stock limit reached (${stock}).`, 'error');
                                                                } else {
                                                                    updateQuantity(item.id, item.size, item.color, item.quantity + 1);
                                                                }
                                                            }}
                                                            disabled={(() => {
                                                                const product = products?.find(p => p.id === item.id);
                                                                const stock = product ? (product.stock !== undefined ? product.stock : 50) : 50;
                                                                const currentTotal = cart.filter(c => c.id === item.id).reduce((sum, c) => sum + c.quantity, 0);
                                                                return currentTotal >= stock;
                                                            })()}
                                                            className={`p-1 rounded ${(() => {
                                                                const product = products?.find(p => p.id === item.id);
                                                                const stock = product ? (product.stock !== undefined ? product.stock : 50) : 50;
                                                                const currentTotal = cart.filter(c => c.id === item.id).reduce((sum, c) => sum + c.quantity, 0);
                                                                return currentTotal >= stock ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-100 dark:hover:bg-gray-800';
                                                            })()}`}
                                                        >
                                                            <Plus size={14} />
                                                        </button>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeFromCart(item.id, item.size, item.color)}
                                                        className="font-medium text-red-600 hover:text-red-500"
                                                    >
                                                        Remove
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            {cart.length > 0 && (
                                <div className="border-t border-gray-100 dark:border-gray-800 p-6 bg-gray-50 dark:bg-gray-900/50">
                                    <div className="flex justify-between text-base font-medium text-gray-900 dark:text-white mb-4">
                                        <p>Subtotal</p>
                                        <p>{formatPrice(cartTotal)}</p>
                                    </div>
                                    <div className="mb-4">
                                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 p-3 rounded-lg flex items-center gap-3">
                                            <div className="text-yellow-600 dark:text-yellow-500">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></svg>
                                            </div>
                                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                                Only <strong>Cash on Delivery</strong> is available at this time.
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsCheckoutOpen(true)}
                                        className="w-full flex items-center justify-center rounded-md border border-transparent bg-primary-600 px-6 py-3 text-base font-medium text-white shadow-sm hover:bg-primary-700 transition-colors"
                                    >
                                        Checkout (COD)
                                    </button>
                                    <div className="mt-6 flex justify-center text-center text-sm text-gray-500 dark:text-gray-400">
                                        <p>
                                            or{' '}
                                            <button
                                                type="button"
                                                className="font-medium text-primary-600 hover:text-primary-500"
                                                onClick={toggleCart}
                                            >
                                                Continue Shopping
                                                <span aria-hidden="true"> &rarr;</span>
                                            </button>
                                        </p>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
            <CheckoutModal
                isOpen={isCheckoutOpen}
                onClose={() => setIsCheckoutOpen(false)}
                onSubmit={handleCheckout}
                total={cartTotal}
            />
        </>
    );
};

export default CartDrawer;
