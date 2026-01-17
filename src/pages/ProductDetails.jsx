import { useParams, Link, useLocation } from 'react-router-dom';
import { useProducts } from '../components/ProductContext';
import { useCart } from '../components/CartContext';
import { useCurrency } from '../components/CurrencyContext';
import { useNotification } from '../components/NotificationContext';
import { useAuth } from '../components/AuthContext';
import { useState, useEffect } from 'react';
import { Plus, Minus, ShoppingBag, Star, Share2, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ProductDetails = () => {
    const { id } = useParams();
    const location = useLocation();
    const { products } = useProducts();
    const { addToCart, cart } = useCart();
    const { showNotification } = useNotification();
    const { formatPrice } = useCurrency();
    const { user, toggleWishlist } = useAuth();

    // Find product (robust string/number comparison)
    // Note: URL params are strings
    const product = products.find(p => String(p.id) === id);

    const [selectedSize, setSelectedSize] = useState(null);
    const [selectedColor, setSelectedColor] = useState(null);
    const [selectedQty, setSelectedQty] = useState(1);
    const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });
    const [showZoom, setShowZoom] = useState(false);
    const [isSizeGuideOpen, setIsSizeGuideOpen] = useState(false);

    // Standard sizes
    const sizes = [38, 39, 40, 41, 42, 43, 44, 45];

    if (!product) {
        return <div className="p-20 text-center">Product not found</div>;
    }

    const handleAddToCart = () => {
        if (!selectedSize) {
            showNotification('Please select a size', 'error');
            return;
        }
        if (product.colors && product.colors.length > 0 && !selectedColor) {
            showNotification('Please select a color', 'error');
            return;
        }

        // Check Stock Limit (Global across variants)
        const currentQtyInCart = cart
            .filter(item => item.id === product.id)
            .reduce((sum, item) => sum + item.quantity, 0);

        const stock = product.stock !== undefined ? product.stock : 50;

        if (currentQtyInCart + selectedQty > stock) {
            showNotification(`Cannot add ${selectedQty} more. You already have ${currentQtyInCart} in cart. Stock limit is ${stock}.`, 'error');
            return;
        }

        // Calculate discounted price if applicable
        const finalPrice = product.isOnSale
            ? product.price * (1 - (product.discountPercentage ?? 20) / 100)
            : product.price;

        const cartItem = {
            ...product,
            price: finalPrice,
            originalPrice: product.price,
            size: selectedSize,
            selectedQty: selectedQty, // Pass quantity to add
            ...(selectedColor && { color: selectedColor }) // Add color if selected
        };

        addToCart(cartItem);
        showNotification(`${selectedQty} x ${product.name} added to cart!`, 'success');
        setSelectedQty(1); // Reset to 1
    };

    const handleMouseMove = (e) => {
        const { left, top, width, height } = e.target.getBoundingClientRect();
        const x = ((e.pageX - left) / width) * 100;
        const y = ((e.pageY - top) / height) * 100;
        setZoomPos({ x, y });
    };

    // Determine Breadcrumb Path Logic
    let categoryPath = '/men';
    let categoryLabel = 'Men';

    // 1. Try to use navigation state (where did they come from?)
    const fromPath = location.state?.from;

    if (fromPath === '/women') {
        categoryPath = '/women';
        categoryLabel = 'Women';
    } else if (fromPath === '/men') {
        categoryPath = '/men';
        categoryLabel = 'Men';
    } else if (fromPath === '/sale') {
        categoryPath = '/sale';
        categoryLabel = 'Sale';
    } else {
        // 2. Fallback: Use Product Gender if no specific path state
        if (product.gender === 'women') {
            categoryPath = '/women';
            categoryLabel = 'Women';
        }
    }

    return (
        <div className="pt-24 pb-16 min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Breadcrumb Navigation */}
                <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6 font-medium">
                    <Link to="/" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Home</Link>
                    <span>/</span>
                    <Link to={categoryPath} className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors capitalize">
                        {categoryLabel}
                    </Link>
                    <span>/</span>
                    <span className="text-gray-900 dark:text-white truncate max-w-[200px]">{product.name}</span>
                </nav>

                <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl overflow-hidden">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
                        {/* Image Section */}
                        <div className="relative bg-gray-100 dark:bg-gray-700 h-[350px] lg:h-auto overflow-hidden group">
                            <motion.img
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ duration: 0.5 }}
                                src={product.image}
                                alt={product.name}
                                className="absolute inset-0 w-full h-full object-cover object-center cursor-crosshair"
                                onMouseMove={handleMouseMove}
                                onMouseEnter={() => setShowZoom(true)}
                                onMouseLeave={() => setShowZoom(false)}
                            />

                            {/* Zoom Lens / Overlay */}
                            {showZoom && (
                                <div
                                    className="absolute inset-0 pointer-events-none hidden lg:block"
                                    style={{
                                        backgroundImage: `url(${product.image})`,
                                        backgroundPosition: `${zoomPos.x}% ${zoomPos.y}%`,
                                        backgroundSize: '200%',
                                        backgroundRepeat: 'no-repeat',
                                        zIndex: 10
                                    }}
                                />
                            )}
                            <div className="absolute top-4 right-4 z-20 hidden md:block">
                                <button className="p-3 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors text-gray-700 dark:text-gray-300">
                                    <Share2 size={20} />
                                </button>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="p-5 lg:p-8 flex flex-col justify-center">
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                            >
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="inline-block px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 text-xs font-bold uppercase tracking-wider">
                                        {product.category}
                                    </span>
                                    {product.code && (
                                        <span className="text-xs font-mono text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 px-2 py-0.5 rounded">
                                            {product.code}
                                        </span>
                                    )}
                                </div>
                                <h1 className="text-2xl lg:text-3xl font-black text-gray-900 dark:text-white mb-2 leading-tight">{product.name}</h1>

                                <div className="flex items-center flex-wrap gap-3 mb-6">
                                    {product.isOnSale ? (
                                        <>
                                            <span className="text-2xl font-bold text-red-600 dark:text-red-500 whitespace-nowrap">
                                                {formatPrice(product.price * (1 - (product.discountPercentage || 20) / 100))}
                                            </span>
                                            <span className="text-base text-gray-500 dark:text-gray-500 line-through decoration-gray-500/50 whitespace-nowrap">
                                                {formatPrice(product.price)}
                                            </span>
                                            <span className="px-3 py-1 bg-red-100 text-red-600 text-sm font-bold rounded-lg shadow-sm border border-red-100 whitespace-nowrap">
                                                -{product.discountPercentage || 20}% SALE
                                            </span>
                                        </>
                                    ) : (
                                        <span className="text-3xl font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
                                    )}
                                </div>

                                <div className="mb-4 font-bold animate-in fade-in slide-in-from-left-4 duration-500">
                                    {(product.stock || 0) === 0 ? (
                                        <span className="text-red-700 dark:text-red-500 flex items-center gap-2 text-lg font-bold animate-pulse">
                                            <span className="relative flex h-3 w-3">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-600 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                                            </span>
                                            Out of Stock
                                        </span>
                                    ) : (product.stock || 0) <= 5 ? (
                                        <span className="text-red-700 dark:text-red-500 flex items-center gap-2 text-lg font-bold animate-pulse">
                                            <span className="relative flex h-3 w-3">
                                                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
                                            </span>
                                            Only {product.stock} left
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex items-center gap-2 mb-8">
                                    <div className="flex text-amber-400">
                                        {[...Array(5)].map((_, i) => (
                                            <Star key={i} size={18} fill="currentColor" />
                                        ))}
                                    </div>
                                    <span className="text-gray-500 dark:text-gray-400 text-sm font-medium">(128 Reviews)</span>
                                </div>

                                <p className="text-gray-600 dark:text-gray-300 text-base leading-relaxed mb-6">
                                    {product.description || "Experience premium comfort and style with our latest collection. Designed for the modern lifestyle, featuring durable materials and ergonomic support."}
                                </p>

                                {/* Color Selector */}
                                {product.colors && product.colors.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Select Color</h3>
                                        <div className="flex flex-wrap gap-3">
                                            {product.colors.map((color) => {
                                                // Simple color mapping helper - extend as needed
                                                const getColorCode = (name) => {
                                                    const map = {
                                                        'Black': '#000000', 'White': '#ffffff', 'Red': '#ef4444',
                                                        'Blue': '#3b82f6', 'Green': '#22c55e', 'Navy': '#1e3a8a',
                                                        'Grey': '#6b7280', 'Orange': '#f97316'
                                                    };
                                                    return map[name] || name; // Fallback to name if regular CSS color
                                                };

                                                return (
                                                    <button
                                                        key={color}
                                                        onClick={() => setSelectedColor(color)}
                                                        className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 border-2 ${selectedColor === color
                                                            ? 'border-gray-900 dark:border-white p-1'
                                                            : 'border-transparent hover:border-gray-200 dark:hover:border-gray-700 p-1'
                                                            }`}
                                                        title={color}
                                                        aria-label={`Select ${color}`}
                                                    >
                                                        <div
                                                            className="w-full h-full rounded-full shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                                                            style={{ backgroundColor: getColorCode(color) }}
                                                        />
                                                    </button>
                                                )
                                            })}
                                        </div>
                                        <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 h-6">
                                            {selectedColor
                                                ? <>Selected: <span className="text-gray-900 dark:text-white font-bold">{selectedColor}</span></>
                                                : <span className="text-red-500 animate-pulse">Please select a color</span>
                                            }
                                        </p>
                                    </div>
                                )}

                                {/* Size Selector */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Select Size (EU)</h3>
                                        <button
                                            onClick={() => setIsSizeGuideOpen(!isSizeGuideOpen)}
                                            className="text-primary-600 dark:text-primary-400 text-sm font-medium hover:underline focus:outline-none"
                                        >
                                            {isSizeGuideOpen ? 'Hide Size Guide' : 'Size Guide'}
                                        </button>
                                    </div>

                                    {/* Size Guide Table */}
                                    <AnimatePresence>
                                        {isSizeGuideOpen && (
                                            <motion.div
                                                initial={{ height: 0, opacity: 0 }}
                                                animate={{ height: "auto", opacity: 1 }}
                                                exit={{ height: 0, opacity: 0 }}
                                                className="overflow-hidden mb-4"
                                            >
                                                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4 text-sm border border-gray-100 dark:border-gray-700">
                                                    <table className="w-full text-center">
                                                        <thead>
                                                            <tr className="border-b border-gray-200 dark:border-gray-600">
                                                                <th className="pb-2 text-gray-600 dark:text-gray-300 font-semibold">EU Size</th>
                                                                <th className="pb-2 text-gray-600 dark:text-gray-300 font-semibold">Sri Lanka / UK (Inch)</th>
                                                                <th className="pb-2 text-gray-600 dark:text-gray-300 font-semibold">CM</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700/50">
                                                            {[
                                                                { eu: 38, uk: 5, cm: 24.5 },
                                                                { eu: 39, uk: 6, cm: 25.1 },
                                                                { eu: 40, uk: 6.5, cm: 25.4 },
                                                                { eu: 41, uk: 7, cm: 25.7 },
                                                                { eu: 42, uk: 8, cm: 26.0 },
                                                                { eu: 43, uk: 9, cm: 26.7 },
                                                                { eu: 44, uk: 9.5, cm: 27.3 },
                                                                { eu: 45, uk: 10.5, cm: 27.9 },
                                                            ].map((row) => (
                                                                <tr key={row.eu} className="hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
                                                                    <td className="py-2 text-gray-900 dark:text-white font-medium">{row.eu}</td>
                                                                    <td className="py-2 text-gray-500 dark:text-gray-400">{row.uk}</td>
                                                                    <td className="py-2 text-gray-500 dark:text-gray-400">{row.cm}</td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                    <p className="text-xs text-gray-400 mt-3 text-center italic">* Standard sizing. For wide feet, consider half size up.</p>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                                        {sizes.map(size => (
                                            <button
                                                key={size}
                                                onClick={() => setSelectedSize(size)}
                                                className={`py-3 rounded-lg text-sm font-bold transition-all duration-200 border-2 ${selectedSize === size
                                                    ? 'border-primary-600 bg-primary-600 text-white shadow-lg scale-105'
                                                    : 'border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-primary-400 dark:hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20'
                                                    }`}
                                            >
                                                {size}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="mt-2 h-6 text-sm font-medium">
                                        {!selectedSize
                                            ? <span className="text-red-500 animate-pulse">Please select a size</span>
                                            : <span className="text-gray-500 dark:text-gray-400">Selected: <span className="text-gray-900 dark:text-white font-bold">{selectedSize}</span></span>
                                        }
                                    </p>
                                </div>

                                {/* Quantity Selector */}
                                <div className="mb-8">
                                    <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4">Select Quantity</h3>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-xl px-2 border border-gray-200 dark:border-gray-700 w-fit">
                                            <button
                                                onClick={() => setSelectedQty(Math.max(1, selectedQty - 1))}
                                                disabled={selectedQty <= 1}
                                                className={`p-3 rounded-lg transition-all duration-200 ${selectedQty <= 1
                                                    ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
                                                    : 'text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400'}`}
                                            >
                                                <Minus size={20} />
                                            </button>
                                            <span className="w-12 text-center font-bold text-lg text-gray-900 dark:text-white">{selectedQty}</span>
                                            <button
                                                onClick={() => {
                                                    // Calculate TOTAL quantity of this product in cart (across all variations)
                                                    const currentQtyInCart = cart
                                                        .filter(item => item.id === product.id)
                                                        .reduce((sum, item) => sum + item.quantity, 0);

                                                    const stock = product.stock !== undefined ? product.stock : 50;

                                                    if (currentQtyInCart + selectedQty >= stock) {
                                                        showNotification(`Max stock limit reached (${stock}). You have ${currentQtyInCart} in cart.`, 'error');
                                                    } else {
                                                        setSelectedQty(selectedQty + 1);
                                                    }
                                                }}
                                                className="p-3 rounded-lg text-gray-600 dark:text-gray-300 hover:text-orange-600 dark:hover:text-orange-400 transition-all duration-200"
                                            >
                                                <Plus size={20} />
                                            </button>
                                        </div>
                                    </div>
                                    <p className="mt-2 text-sm font-medium text-gray-500 dark:text-gray-400 h-6">
                                        Selected: <span className="text-gray-900 dark:text-white font-bold">{selectedQty}</span>
                                    </p>
                                </div>

                                {/* Actions */}
                                <div className="flex flex-col sm:flex-row gap-4">


                                    <button
                                        onClick={handleAddToCart}
                                        disabled={(product.stock || 0) === 0 || !selectedSize || (product.colors && product.colors.length > 0 && !selectedColor)}
                                        className={`flex-1 py-4 px-8 rounded-xl font-bold text-lg flex items-center justify-center gap-3 transition-colors duration-300 shadow-lg ${(product.stock || 0) === 0
                                            ? 'bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-600 cursor-not-allowed border border-gray-200 dark:border-gray-700 opacity-70'
                                            : selectedSize && (!product.colors || product.colors.length === 0 || selectedColor)
                                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:bg-primary-600 hover:text-white dark:hover:bg-primary-600 dark:hover:text-white hover:shadow-xl cursor-pointer'
                                                : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                            }`}
                                    >
                                        <ShoppingBag size={24} />
                                        Add to Cart
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!user) {
                                                showNotification('Please login to add to wishlist', 'error');
                                                return;
                                            }
                                            const isAdded = toggleWishlist(product);
                                            showNotification(
                                                isAdded ? 'Added to wishlist' : 'Removed from wishlist',
                                                isAdded ? 'success' : 'info'
                                            );
                                        }}
                                        className={`p-4 rounded-xl border-2 transition-colors flex items-center justify-center ${user?.wishlist?.some(p => p.id === product.id)
                                            ? 'border-red-500 bg-red-50 text-red-500 dark:bg-red-900/20 dark:border-red-500'
                                            : 'border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white hover:border-gray-900 dark:hover:border-white'
                                            }`}
                                    >
                                        <Heart
                                            size={24}
                                            fill={user?.wishlist?.some(p => p.id === product.id) ? "currentColor" : "none"}
                                        />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div >
        </div >
    );
};

export default ProductDetails;
