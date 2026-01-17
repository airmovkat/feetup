import { useNavigate, useLocation } from 'react-router-dom';
import { Plus, Heart } from 'lucide-react';
import { useCurrency } from './CurrencyContext';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const ProductCard = ({ product }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const { formatPrice } = useCurrency();
    const { user, toggleWishlist, wishlist } = useAuth();
    const { showNotification } = useNotification();

    const handleNavigate = () => {
        navigate(`/product/${product.id}`, { state: { from: location.pathname } });
    };

    const handleWishlistClick = (e) => {
        e.stopPropagation();
        if (!user) {
            showNotification('Please login to add to wishlist', 'error');
            return;
        }
        toggleWishlist(product.id);
        const isAdded = !isInWishlist; // Optimistic toggle
        showNotification(isAdded ? 'Added to wishlist' : 'Removed from wishlist', isAdded ? 'success' : 'info');
    };

    const isInWishlist = wishlist.includes(product.id);

    return (
        <div
            onClick={handleNavigate}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-md transition-shadow duration-300 overflow-hidden group cursor-pointer"
        >
            <div className="relative aspect-square bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />

                {/* Out of Stock 3D Ribbon */}
                {(product.stock || 0) === 0 && (
                    <div className="absolute top-0 right-0 w-[100px] h-[100px] overflow-hidden z-30 pointer-events-none">
                        <div className="absolute top-[18px] right-[-35px] w-[140px] rotate-45 bg-gradient-to-r from-red-700 via-red-600 to-red-700 text-white text-[10px] font-bold text-center py-1.5 shadow-lg border-y border-white/20 uppercase tracking-widest">
                            Out of Stock
                        </div>
                    </div>
                )}

                {/* Sale Stamp Badge */}
                {product.isOnSale && (
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 -rotate-12 w-24 h-24 rounded-full border-[6px] border-double border-red-600 bg-transparent flex flex-col items-center justify-center text-red-600 font-black pointer-events-none">
                        <span className="text-2xl leading-none">{product.discountPercentage ?? 20}%</span>
                        <span className="text-xs tracking-[0.2em] leading-none mt-1">OFF</span>
                    </div>
                )}
                {/* Product Code Badge */}
                {product.code && (
                    <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-1 rounded-md z-10 shadow-sm border border-white/10">
                        {product.code}
                    </div>
                )}

                {/* Wishlist Button */}
                {/* Wishlist Button */}
                <button
                    onClick={handleWishlistClick}
                    className={`absolute bottom-4 left-4 p-3 rounded-full shadow-lg opacity-0 group-hover:opacity-100 translate-y-full group-hover:translate-y-0 transition-all duration-300 z-20 ${isInWishlist
                        ? 'bg-red-50 text-red-500 dark:bg-red-900/20 dark:text-red-500'
                        : 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                    aria-label="Add to wishlist"
                >
                    <Heart size={20} fill={isInWishlist ? "currentColor" : "none"} />
                </button>

                <button
                    onClick={(e) => {
                        e.stopPropagation(); // Prevent double navigation event if outer div fires
                        handleNavigate();
                    }}
                    className="absolute bottom-4 right-4 p-3 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-full shadow-lg translate-y-full opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary-500 hover:text-white dark:hover:bg-primary-500"
                    aria-label="View Details"
                >
                    <Plus size={20} />
                </button>
            </div>
            <div className="p-4">
                <div className="flex justify-between items-start mb-2">
                    <div>
                        <p className="text-sm text-primary-600 dark:text-primary-400 font-medium mb-1">{product.category}</p>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white line-clamp-1">{product.name}</h3>
                    </div>
                    {product.isOnSale ? (
                        <div className="text-right">
                            <p className="text-lg font-bold text-red-600 dark:text-red-500">
                                {formatPrice(product.price * (1 - (product.discountPercentage ?? 20) / 100))}
                            </p>
                            <p className="text-xs text-gray-400 line-through">
                                {formatPrice(product.price)}
                            </p>
                        </div>
                    ) : (
                        <p className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</p>
                    )}
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</p>
            </div>
        </div>
    );
};

export default ProductCard;
