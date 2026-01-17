import { useState, useRef, useEffect } from 'react';
import { ShoppingCart, User, Menu, X, Sun, Moon, Footprints, Bell, Package, CheckCircle, Trash2 } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useCart } from './CartContext';
import { useTheme } from './ThemeContext';
import { useCurrency } from './CurrencyContext';
import { useAuth } from './AuthContext';
import { useNotification } from './NotificationContext';

const Header = ({ isAdmin }) => {
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const notificationRef = useRef(null);

    const { toggleCart, cart } = useCart();
    const { isDark, toggleTheme } = useTheme();
    const { user, logout, adminUser } = useAuth();
    const { currency, toggleCurrency } = useCurrency();
    const { persistentNotifications, unreadCount, markAllAsRead, clearAllPersistent } = useNotification();

    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

    // Close notification panel when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (notificationRef.current && !notificationRef.current.contains(event.target)) {
                setIsNotificationOpen(false);
            }
        };
        if (isNotificationOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isNotificationOpen]);

    const handleNotificationClick = () => {
        setIsNotificationOpen(!isNotificationOpen);
        if (!isNotificationOpen) {
            // Give a small delay before marking as read so user sees the dots
            setTimeout(markAllAsRead, 1000);
        }
    };

    const navLinks = [
        { name: "Home", path: "/" },
        { name: "Men's", path: "/men" },
        { name: "Women's", path: "/women" },
        { name: "Sale", path: "/sale" },
        { name: "About Us", path: "/about" },
        { name: "Contact Us", path: "/contact" },
    ];

    if (isAdmin) {
        return (
            <header className="sticky top-0 z-[60] bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 transition-colors duration-200 shadow-md">
                <div className="w-full px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        {/* Minimal Logo */}
                        <Link to="/admin" className="flex-shrink-0 flex items-center gap-2 group relative w-64">
                            <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-1.5 rounded-lg relative z-10 transition-transform group-hover:scale-110">
                                <Footprints className="text-white w-6 h-6" strokeWidth={2.5} />
                            </div>
                            <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent relative z-10 flex items-center">
                                FeetUp
                                {location.pathname !== '/admin/login' ? (
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">
                                        {adminUser?.role === 'seller' ? 'Seller' : adminUser?.role === 'courier' ? 'Courier' : 'Owner'}
                                    </span>
                                ) : (
                                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400 ml-1">Login</span>
                                )}
                            </span>
                        </Link>

                        <div className="flex items-center space-x-4">
                            {/* Seller/Admin Welcome Msg */}
                            {adminUser && (
                                <div className="hidden md:flex items-center gap-3 mr-2 bg-gray-50 dark:bg-white/5 pl-1 pr-3 py-1 rounded-full border border-gray-100 dark:border-white/10">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm shadow-sm">
                                        {adminUser.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Welcome,</span>
                                        <span className="text-sm font-bold text-gray-900 dark:text-white">
                                            {adminUser.name}
                                        </span>
                                        <span className="text-xs font-bold text-gray-600 dark:text-gray-400 font-mono">
                                            ({adminUser.id})
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Theme Toggle */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 focus:outline-none transition-colors"
                                aria-label="Toggle Dark Mode"
                            >
                                {isDark ? <Sun size={20} /> : <Moon size={20} />}
                            </button>

                            {/* Notifications Bell */}
                            {adminUser?.role && ['owner', 'seller'].includes(adminUser.role.toLowerCase()) && (
                                <div className="relative" ref={notificationRef}>
                                    <button
                                        onClick={handleNotificationClick}
                                        className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 focus:outline-none relative transition-colors"
                                        aria-label="Notifications"
                                    >
                                        <Bell size={20} className={`transition-transform duration-300 ${unreadCount > 0 ? 'text-red-600 dark:text-red-500 animate-pulse' : ''}`} />
                                        {unreadCount > 0 && (
                                            <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                                            </span>
                                        )}
                                    </button>

                                    {/* Notification Panel Overlay */}
                                    <AnimatePresence>
                                        {isNotificationOpen && (
                                            <motion.div
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                transition={{ duration: 0.2, ease: "easeOut" }}
                                                className="absolute right-0 mt-3 w-80 md:w-96 bg-white/90 dark:bg-zinc-900/40 backdrop-blur-2xl border border-gray-200/50 dark:border-white/10 shadow-2xl rounded-2xl overflow-hidden z-[70] origin-top-right"
                                            >
                                                <div className="p-4 border-b border-gray-50 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900 dark:text-zinc-100">Notifications</h3>
                                                        <p className="text-[10px] text-gray-500 dark:text-zinc-400 uppercase tracking-widest font-bold">Latest activity</p>
                                                    </div>
                                                    <button
                                                        onClick={clearAllPersistent}
                                                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                        title="Clear All"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>

                                                <div className="max-h-[70vh] overflow-y-auto">
                                                    {persistentNotifications.length === 0 ? (
                                                        <div className="p-10 text-center">
                                                            <div className="w-12 h-12 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3">
                                                                <Bell size={20} className="text-gray-400" />
                                                            </div>
                                                            <p className="text-sm text-gray-500 dark:text-gray-400">No notifications yet</p>
                                                        </div>
                                                    ) : (
                                                        <div className="divide-y divide-gray-50 dark:divide-white/5">
                                                            {persistentNotifications.map((notif) => (
                                                                <div
                                                                    key={notif.id}
                                                                    className={`p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors relative flex gap-3 ${!notif.isRead ? 'bg-primary-50/10 dark:bg-primary-500/5' : ''}`}
                                                                >
                                                                    <div className={`mt-1 shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${notif.type === 'order'
                                                                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30'
                                                                        : 'bg-green-100 text-green-600 dark:bg-green-900/30'
                                                                        }`}>
                                                                        {notif.type === 'order' ? <Package size={16} /> : <CheckCircle size={16} />}
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <h4 className="text-sm font-bold text-gray-900 dark:text-zinc-100 truncate">{notif.title}</h4>
                                                                        <p className="text-xs text-gray-600 dark:text-zinc-300 mt-0.5 line-clamp-2">{notif.message}</p>
                                                                        <span className="text-[10px] text-gray-500 dark:text-zinc-100 mt-2 block font-bold">
                                                                            {new Date(notif.timestamp).toLocaleString(undefined, {
                                                                                hour: 'numeric',
                                                                                minute: 'numeric',
                                                                                hour12: true,
                                                                                day: 'numeric',
                                                                                month: 'short'
                                                                            })}
                                                                        </span>
                                                                    </div>
                                                                    {!notif.isRead && (
                                                                        <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full" />
                                                                    )}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>

                                                {persistentNotifications.length > 0 && (
                                                    <div className="p-3 bg-gray-50/50 dark:bg-white/5 border-t border-gray-50 dark:border-white/5 text-center">
                                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">End of path</span>
                                                    </div>
                                                )}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            )}

                            {/* Currency Switcher */}
                            <div className="relative">
                                <button
                                    onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                    className="flex items-center justify-center space-x-1 p-2 w-20 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                                >
                                    <img
                                        src={currency === 'USD' ? 'https://flagcdn.com/w40/us.png' : 'https://flagcdn.com/w40/lk.png'}
                                        alt={currency}
                                        className="w-6 h-4 object-cover rounded-sm"
                                    />
                                </button>
                                {isCurrencyOpen && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-10"
                                            onClick={() => setIsCurrencyOpen(false)}
                                        />
                                        <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                            <button
                                                onClick={() => { toggleCurrency('USD'); setIsCurrencyOpen(false); }}
                                                className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <img src="https://flagcdn.com/w40/us.png" alt="USD" className="w-6 h-4 object-cover rounded-sm" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">USD</span>
                                            </button>
                                            <button
                                                onClick={() => { toggleCurrency('LKR'); setIsCurrencyOpen(false); }}
                                                className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                            >
                                                <img src="https://flagcdn.com/w40/lk.png" alt="LKR" className="w-6 h-4 object-cover rounded-sm" />
                                                <span className="text-sm font-medium text-gray-700 dark:text-gray-200">LKR</span>
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>
        );
    }

    return (
        <header className="sticky top-0 z-[60] bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    {/* Logo with animation for customer site */}
                    <Link to="/" className="flex-shrink-0 flex items-center gap-2 group relative">
                        <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-1.5 rounded-lg relative z-10 transition-transform group-hover:scale-110">
                            <Footprints className="text-white w-6 h-6" strokeWidth={2.5} />
                        </div>
                        <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent relative z-10">
                            FeetUp
                        </span>

                        {/* 4 Gold 3D Hanging Boxes */}
                        <div className="absolute top-1/2 -right-4 sm:right-0 flex gap-0.5 pointer-events-none flex scale-75 sm:scale-100 origin-top-left">
                            {[2, 0, 2, 6].map((num, i) => (
                                <div key={i} className="relative flex flex-col items-center">
                                    {/* Static Hanging Rod */}
                                    <div className="w-[1px] h-8 bg-yellow-600/50" />

                                    {/* Animated 3D Gold Box */}
                                    <motion.div
                                        animate={{
                                            rotate: [0, -8, 8, 0],
                                            x: [0, -2, 2, 0]
                                        }}
                                        transition={{
                                            duration: 3 + i * 0.2, // Staggered duration
                                            repeat: Infinity,
                                            ease: "easeInOut",
                                            delay: i * 0.1 // Staggered delay
                                        }}
                                        className="w-5 h-6 bg-gradient-to-br from-yellow-300 via-yellow-500 to-yellow-600 border border-yellow-400 shadow-[2px_2px_0_0_#854d0e,4px_4px_10px_rgba(0,0,0,0.3)] flex items-center justify-center"
                                    >
                                        <span className="text-[10px] font-black text-yellow-950 drop-shadow-sm">
                                            {num}
                                        </span>
                                    </motion.div>
                                </div>
                            ))}
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-8">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors"
                            >
                                {link.name}
                            </Link>
                        ))}
                    </nav>

                    {/* Icons */}
                    <div className="hidden md:flex items-center space-x-6">

                        {/* Theme Toggle */}
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 focus:outline-none"
                            aria-label="Toggle Dark Mode"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>

                        {/* Cart */}
                        <button
                            onClick={toggleCart}
                            className="relative p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                        >
                            <ShoppingCart size={20} />
                            {totalItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/4 -translate-y-1/4 bg-primary-600 rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </button>

                        {/* Profile/Auth */}
                        {user && user.isVerified ? (
                            <div className="flex items-center space-x-4">
                                <Link
                                    to="/profile"
                                    className="flex items-center space-x-3 group"
                                >
                                    <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-primary-500 group-hover:border-primary-600 transition-colors">
                                        <img
                                            src={user.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=100&auto=format&fit=crop'}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-primary-600 transition-colors">
                                        {user.name.split(' ')[0]}
                                    </span>
                                </Link>
                                <button
                                    onClick={logout}
                                    className="p-2 text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
                                    title="Logout"
                                >
                                    <User size={20} />
                                </button>
                            </div>
                        ) : (
                            <Link
                                to="/login"
                                className="p-2 text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors"
                                title="Login"
                            >
                                <User size={20} />
                            </Link>
                        )}

                        {/* Currency Switcher (Moved to End) */}
                        <div className="relative">
                            <button
                                onClick={() => setIsCurrencyOpen(!isCurrencyOpen)}
                                className="flex items-center justify-center space-x-1 p-2 w-20 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 font-medium transition-colors hover:bg-gray-50 dark:hover:bg-gray-800"
                            >
                                <img
                                    src={currency === 'USD' ? 'https://flagcdn.com/w40/us.png' : 'https://flagcdn.com/w40/lk.png'}
                                    alt={currency}
                                    className="w-6 h-4 object-cover rounded-sm"
                                />
                                <span className="text-sm">{currency}</span>
                            </button>

                            {isCurrencyOpen && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setIsCurrencyOpen(false)}
                                    />
                                    <div className="absolute top-full right-0 mt-2 w-32 bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-20 animate-in fade-in zoom-in-95 duration-200">
                                        <button
                                            onClick={() => { toggleCurrency('USD'); setIsCurrencyOpen(false); }}
                                            className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <img src="https://flagcdn.com/w40/us.png" alt="USD" className="w-6 h-4 object-cover rounded-sm" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">USD</span>
                                        </button>
                                        <button
                                            onClick={() => { toggleCurrency('LKR'); setIsCurrencyOpen(false); }}
                                            className="flex items-center space-x-3 w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                        >
                                            <img src="https://flagcdn.com/w40/lk.png" alt="LKR" className="w-6 h-4 object-cover rounded-sm" />
                                            <span className="text-sm font-medium text-gray-700 dark:text-gray-200">LKR</span>
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center space-x-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 text-gray-500 dark:text-gray-400"
                        >
                            {isDark ? <Sun size={20} /> : <Moon size={20} />}
                        </button>
                        <button
                            onClick={toggleCart}
                            className="relative p-2 text-gray-500 dark:text-gray-400"
                        >
                            <ShoppingCart size={20} />
                            {totalItems > 0 && (
                                <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-xs font-bold leading-none text-white bg-primary-600 rounded-full">
                                    {totalItems}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="p-2 rounded-md text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 focus:outline-none"
                        >
                            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Menu */}
            {isMobileMenuOpen && (
                <div className="md:hidden bg-white dark:bg-black border-b border-gray-100 dark:border-gray-800">
                    <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                onClick={() => setIsMobileMenuOpen(false)}
                            >
                                {link.name}
                            </Link>
                        ))}

                        {/* Mobile Currency Switcher */}
                        <div className="pt-4 pb-4 border-t border-gray-100 dark:border-gray-800">
                            <div className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                Coin
                            </div>
                            <div className="grid grid-cols-2 gap-2 px-3">
                                <button
                                    onClick={() => {
                                        toggleCurrency('USD');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`flex items-center justify-center space-x-2 p-2 rounded-lg border ${currency === 'USD'
                                        ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400'
                                        : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <img src="https://flagcdn.com/w40/us.png" alt="USD" className="w-5 h-3 object-cover rounded-sm" />
                                    <span className="text-sm font-bold">USD</span>
                                </button>
                                <button
                                    onClick={() => {
                                        toggleCurrency('LKR');
                                        setIsMobileMenuOpen(false);
                                    }}
                                    className={`flex items-center justify-center space-x-2 p-2 rounded-lg border ${currency === 'LKR'
                                        ? 'bg-primary-50 border-primary-200 text-primary-700 dark:bg-primary-900/20 dark:border-primary-800 dark:text-primary-400'
                                        : 'bg-white border-gray-200 text-gray-700 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300'
                                        }`}
                                >
                                    <img src="https://flagcdn.com/w40/lk.png" alt="LKR" className="w-5 h-3 object-cover rounded-sm" />
                                    <span className="text-sm font-bold">LKR</span>
                                </button>
                            </div>
                        </div>

                        {/* Mobile Auth Links */}
                        <div className="pt-4 pb-1 border-t border-gray-100 dark:border-gray-800">
                            {user && user.isVerified ? (
                                <>
                                    <div className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Logged in as: <span className="text-gray-900 dark:text-white">{user.name}</span>
                                    </div>
                                    <Link
                                        to="/profile"
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        My Profile
                                    </Link>
                                    <button
                                        onClick={() => {
                                            logout();
                                            setIsMobileMenuOpen(false);
                                        }}
                                        className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        Log Out
                                    </button>
                                </>
                            ) : (
                                <>
                                    <Link
                                        to="/login"
                                        className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Log In
                                    </Link>
                                    <Link
                                        to="/signup"
                                        className="block px-3 py-2 rounded-md text-base font-medium text-primary-600 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    >
                                        Sign Up
                                    </Link>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </header>
    );
};

export default Header;
