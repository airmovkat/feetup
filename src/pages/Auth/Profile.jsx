import { useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Phone, MapPin, Calendar, Camera, Save, CheckCircle, X, Upload, Package, Heart, ShoppingBag } from 'lucide-react';
import { jsPDF } from 'jspdf'; // Correct import for v2.5+
import autoTable from 'jspdf-autotable'; // Explicit import
import { useAuth } from '../../components/AuthContext';
import { useOrders } from '../../components/OrderContext';
import { useCurrency } from '../../components/CurrencyContext';
import { useProducts } from '../../components/ProductContext'; // For color codes if needed, or define helper

const Profile = () => {
    const { user, updateUser, wishlist, toggleWishlist } = useAuth();
    const { orders } = useOrders();
    const { formatPrice } = useCurrency();
    const { products } = useProducts();
    const [activeTab, setActiveTab] = useState('profile');

    // Filter orders for current user
    const userOrders = orders.filter(o => o.customer?.email === user?.email).sort((a, b) => new Date(b.date) - new Date(a.date));

    // Helper for color code (duplicated from ProductDetails for now to ensure self-containment without creating new utils file yet)
    const getColorCode = (colorName) => {
        const colors = {
            'Black': '#1F2937', 'White': '#FFFFFF', 'Red': '#EF4444', 'Blue': '#3B82F6',
            'Green': '#10B981', 'Yellow': '#F59E0B', 'Purple': '#8B5CF6', 'Pink': '#EC4899',
            'Orange': '#F97316', 'Gray': '#6B7280', 'Brown': '#78350F', 'Navy': '#1E3A8A'
        };
        return colors[colorName] || colorName;
    };

    const fileInputRef = useRef(null);
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || '',
        address: user?.address || '',
        city: user?.city || '',
        zip: user?.zip || '',
        birthday: user?.birthday ? (() => {
            const d = new Date(user.birthday);
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        })() : '',
        profile_picture: user?.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop'
    });
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');

    const formatDate = (dateString) => {
        if (!dateString) return '';
        const d = new Date(dateString);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const hasChanges =
        formData.name !== (user.name || '') ||
        formData.phone !== (user.phone || '') ||
        formData.address !== (user.address || '') ||
        formData.city !== (user.city || '') ||
        formData.zip !== (user.zip || '') ||
        formData.birthday !== formatDate(user.birthday) ||
        formData.profile_picture !== (user.profile_picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=200&auto=format&fit=crop');

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Validation
        if (!file.type.startsWith('image/')) {
            setError('Please upload an image file.');
            return;
        }
        if (file.size > 1024 * 1024) { // 1MB limit for localStorage
            setError('Image size should be less than 1MB.');
            return;
        }

        setError('');
        const reader = new FileReader();
        reader.onloadend = () => {
            setFormData({ ...formData, profile_picture: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setError(''); // Clear any previous errors on submit
        updateUser(formData);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const handleDownloadSummary = () => {
        if (userOrders.length === 0) {
            alert("No orders to download.");
            return;
        }

        try {
            const doc = new jsPDF();

            // --- Header ---
            // Logo Graphic (Shoe Prints - Matches Uploaded ID)
            doc.setFillColor(249, 115, 22); // Primary Orange
            doc.roundedRect(14, 12, 12, 12, 3, 3, 'F'); // Background box

            doc.setFillColor(255, 255, 255); // White for feet

            // Helper to draw a shoe sole
            const drawSole = (x, y) => {
                // Heel
                doc.ellipse(x, y + 1.2, 0.9, 1.2, 'F');
                // Forefoot (slightly larger and offset up)
                doc.ellipse(x + 0.2, y - 0.5, 1.1, 1.6, 'F');
                // Connect them (rect in middle to smooth arch)
                // doc.rect(x - 0.5, y - 0.2, 1, 1, 'F'); 
            };

            // Left Foot (Lower) - Slightly rotated if possible? jsPDF ellipse allows rotation but simplest is grouping.
            // Let's stick to simple overlapping ellipses to form the "8" shape of a sole

            // Left Foot
            // Heel circle
            doc.ellipse(17.5, 20.5, 0.8, 1.0, 'F');
            // Forefoot oval
            doc.ellipse(17.8, 18.2, 1.0, 1.5, 'F');

            // Right Foot (Higher)
            // Heel circle
            doc.ellipse(21.5, 16.5, 0.8, 1.0, 'F');
            // Forefoot oval
            doc.ellipse(21.8, 14.2, 1.0, 1.5, 'F');

            // Company Name
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(249, 115, 22);
            doc.text("FeetUp", 30, 21); // Offset to right of icon

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100);
            doc.text("Premium Footwear", 30, 26);

            // Document Title
            doc.setFontSize(18);
            doc.setTextColor(0);
            doc.text("Order Summary", 196, 20, { align: 'right' });

            // Date
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated on: ${new Date().toLocaleString()}`, 196, 26, { align: 'right' });

            // --- Customer Details ---
            doc.setDrawColor(230);
            doc.line(14, 32, 196, 32);

            doc.setFontSize(12);
            doc.setTextColor(0);
            doc.setFont("helvetica", "bold");
            doc.text("Customer Details:", 14, 42);

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.text(`Name:   ${user.name}`, 14, 48);
            doc.text(`Email:  ${user.email}`, 14, 54);

            // Add Phone Number
            // Note: user.phone field should be available. If not, use N/A.
            // Assuming user.phone exists on the user object (it is used in the form state).
            doc.text(`Phone:  ${user.phone || 'N/A'}`, 14, 60);

            // --- Table ---
            const tableColumn = ["Order ID", "Date & Time", "Items", "Status", "Amount"];
            const tableRows = [];

            userOrders.forEach(order => {
                const orderDate = new Date(order.date).toLocaleString();

                // Format items list
                const itemsFormatted = order.items.map(item =>
                    `• ${item.name}${item.code ? ` [${item.code}]` : ''} (${item.size}${item.color ? `, ${item.color}` : ''}) x${item.quantity}`
                ).join('\n');

                const orderData = [
                    order.id,
                    orderDate,
                    itemsFormatted,
                    order.status,
                    formatPrice(order.total)
                ];
                tableRows.push(orderData);
            });

            const totalOrders = userOrders.length;
            const totalSpent = userOrders.reduce((acc, order) => acc + order.total, 0);
            const lastActive = userOrders.length > 0
                ? new Date(Math.max(...userOrders.map(o => new Date(o.date)))).toLocaleString()
                : 'N/A';

            doc.setFont("helvetica", "bold");
            doc.text(`Total Orders: ${totalOrders}`, 100, 48);
            doc.text(`Total Spent:  ${formatPrice(totalSpent)}`, 100, 54);
            doc.text(`Last Active:  ${lastActive}`, 100, 60);

            autoTable(doc, {
                head: [tableColumn],
                body: tableRows,
                startY: 75,
                theme: 'grid',
                margin: { top: 20, bottom: 25 }, // Ensure bottom margin clears footer
                headStyles: {
                    fillColor: [249, 115, 22], // Primary Orange
                    textColor: [255, 255, 255],
                    fontStyle: 'bold'
                },
                styles: {
                    fontSize: 9,
                    cellPadding: 3,
                    valign: 'middle',
                    overflow: 'linebreak' // Handle long text wrapping
                },
                pageBreak: 'auto', // Enable auto page break
                // ... rest of config ...
                columnStyles: {
                    0: { cellWidth: 25 }, // ID
                    1: { cellWidth: 25 }, // Date
                    2: { cellWidth: 80 }, // Items
                    3: { cellWidth: 25 }, // Status
                    4: { cellWidth: 30, halign: 'right' }  // Amount
                },
                didParseCell: (data) => {
                    // Colorize Status column
                    if (data.section === 'body' && data.column.index === 3) {
                        const status = data.cell.raw;
                        if (status === 'Delivered') {
                            data.cell.styles.textColor = [22, 163, 74]; // Green
                        } else if (status === 'Cancelled') {
                            data.cell.styles.textColor = [220, 38, 38]; // Red
                        } else {
                            data.cell.styles.textColor = [202, 138, 4]; // Yellow/Orange
                        }
                    }
                }
            });

            // --- Footer ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();

                doc.setDrawColor(249, 115, 22); // Orange Line
                doc.setLineWidth(1);
                doc.line(14, pageHeight - 20, 196, pageHeight - 20);

                doc.setFontSize(8);
                doc.setTextColor(100);

                const footerY = pageHeight - 14;
                doc.text("FeetUp Inc. | 123 Shoe Lane, Fashion City, FC 12345", 105, footerY, { align: 'center' });
                doc.text("Contact: support@feetup.com | +1 (234) 567-890", 105, footerY + 4, { align: 'center' });
            }

            doc.save(`FeetUp_Order_Summary_${new Date().toISOString().slice(0, 10)}.pdf`);
        } catch (err) {
            console.error("PDF Download Error:", err);
            alert("Failed to download PDF. Please check console for details.");
        }
    };

    if (!user) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <p className="text-gray-500">Please log in to view your profile.</p>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto px-4 py-12">
            {/* Error Message */}
            <AnimatePresence>
                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="mb-6 p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl flex items-center justify-between"
                    >
                        <span>{error}</span>
                        <button onClick={() => setError('')}><X size={18} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Toast Notification */}
            <AnimatePresence>
                {saved && (
                    <motion.div
                        initial={{ opacity: 0, y: 50, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: 20, x: '-50%' }}
                        className="fixed bottom-10 left-1/2 z-[100] flex items-center gap-3 px-6 py-4 bg-gray-900 dark:bg-primary-600 text-white rounded-2xl shadow-2xl border border-white/10"
                    >
                        <div className="bg-green-500 p-1 rounded-full">
                            <CheckCircle size={18} className="text-white" />
                        </div>
                        <span className="font-bold whitespace-nowrap">Profile updated successfully!</span>
                        <button
                            onClick={() => setSaved(false)}
                            className="ml-2 p-1 hover:bg-white/10 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-800"
            >
                {/* Header/Cover */}
                <div className="h-32 bg-gradient-to-r from-primary-500 to-primary-600"></div>

                <div className="px-8 pb-8">
                    {/* Profile Header */}
                    <div className="relative -mt-16 mb-8 flex flex-col md:flex-row items-end gap-6">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                            <img
                                src={formData.profile_picture}
                                alt="Profile"
                                className="w-32 h-32 rounded-2xl object-cover border-4 border-white dark:border-gray-900 shadow-xl group-hover:opacity-75 transition-opacity"
                            />
                            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white text-xs font-bold gap-1">
                                <Camera size={20} />
                                <span>Change Photo</span>
                            </div>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                accept="image/*"
                                className="hidden"
                            />
                        </div>
                        <div className="flex-1 mb-2 text-center md:text-left">
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                            <div className="flex flex-col md:flex-row md:items-center gap-2 text-sm text-gray-500 dark:text-gray-400 font-medium">
                                <span className="text-primary-600 dark:text-primary-400">FeetUp Member</span>
                                <span className="hidden md:inline">•</span>
                                <span>Joined {new Date(user.joinedDate || user.id).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex space-x-6 border-b border-gray-200 dark:border-gray-700 mb-8">
                        <button
                            onClick={() => setActiveTab('profile')}
                            className={`pb-4 text-sm font-bold tracking-wide transition-colors relative ${activeTab === 'profile'
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Profile Settings
                            {activeTab === 'profile' && (
                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('orders')}
                            className={`pb-4 text-sm font-bold tracking-wide transition-colors relative ${activeTab === 'orders'
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            My Orders
                            {activeTab === 'orders' && (
                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('wishlist')}
                            className={`pb-4 text-sm font-bold tracking-wide transition-colors relative ${activeTab === 'wishlist'
                                ? 'text-primary-600 dark:text-primary-400'
                                : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                                }`}
                        >
                            Wishlist
                            {activeTab === 'wishlist' && (
                                <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-600 dark:bg-primary-400" />
                            )}
                        </button>
                    </div>

                    {activeTab === 'profile' ? (
                        <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Basic Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="email"
                                            readOnly
                                            value={formData.email}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-800/50 border-gray-200 dark:border-gray-700 rounded-xl text-gray-500 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ... rest of form ... */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="text"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                                            placeholder="+1 (234) 567-890"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Birthday</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="date"
                                            value={formData.birthday}
                                            onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
                                            className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                                <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                    <MapPin size={20} className="text-primary-600" />
                                    Shipping Address
                                </h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Street Address</label>
                                        <input
                                            type="text"
                                            value={formData.address}
                                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                                            placeholder="123 Shoe Lane"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">City</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                                            placeholder="Fashion City"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">ZIP Code</label>
                                        <input
                                            type="text"
                                            value={formData.zip}
                                            onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                            className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                                            placeholder="12345"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end pt-6">
                                <button
                                    type="submit"
                                    disabled={!hasChanges}
                                    className={`flex items-center gap-2 px-8 py-4 font-bold rounded-xl transition-all ${hasChanges
                                        ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-lg shadow-primary-500/25'
                                        : 'bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-500 cursor-not-allowed'
                                        }`}
                                >
                                    <Save size={20} />
                                    Save Changes
                                </button>
                            </div>
                        </form>
                    ) : activeTab === 'wishlist' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {(!wishlist || wishlist.length === 0) ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <Heart size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Your wishlist is empty</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2">Save items you love to find them easily later!</p>
                                    <Link to="/" className="inline-block mt-6 px-6 py-3 bg-primary-600 text-white font-bold rounded-xl hover:bg-primary-700 transition-colors">
                                        Start Shopping
                                    </Link>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {wishlist.map(productId => {
                                        const product = products.find(p => p.id === productId);
                                        if (!product) return null; // Skip if product not found
                                        return (
                                            <div key={product.id} className="group bg-white dark:bg-gray-800 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700 overflow-hidden flex flex-col">
                                                <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-700">
                                                    <img
                                                        src={product.image}
                                                        alt={product.name}
                                                        className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
                                                    />
                                                    {/* Product Code Badge */}
                                                    {product.code && (
                                                        <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-[10px] font-mono px-2 py-1 rounded-md z-10 shadow-sm border border-white/10">
                                                            {product.code}
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => toggleWishlist(product.id)}
                                                        className="absolute top-3 right-3 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors shadow-lg"
                                                        title="Remove from wishlist"
                                                    >
                                                        <Heart size={18} fill="currentColor" />
                                                    </button>
                                                </div>
                                                <div className="p-5 flex-1 flex flex-col">
                                                    <span className="text-xs font-bold text-primary-600 dark:text-primary-400 uppercase tracking-wider mb-2">{product.category}</span>
                                                    <h3 className="font-bold text-gray-900 dark:text-white mb-2 line-clamp-1">{product.name}</h3>
                                                    <div className="mt-auto flex items-center justify-between pt-4 border-t border-gray-100 dark:border-gray-700">
                                                        <span className="text-lg font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</span>
                                                        <Link
                                                            to={`/product/${product.id}`}
                                                            className="p-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg hover:scale-105 transition-transform"
                                                        >
                                                            <ShoppingBag size={18} />
                                                        </Link>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

                            {/* Download Summary Button Area */}
                            {userOrders.length > 0 && (
                                <div className="flex justify-end mb-4">
                                    <button
                                        onClick={handleDownloadSummary}
                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-medium transition-colors border border-gray-200 dark:border-gray-700"
                                    >
                                        <Upload size={16} className="rotate-180" /> {/* Using Upload rotated as Download icon */}
                                        Download Order Summary
                                    </button>
                                </div>
                            )}

                            {userOrders.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4 text-gray-400">
                                        <Package size={32} />
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">No orders yet</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mt-2">Start shopping to see your orders here!</p>
                                </div>
                            ) : (
                                userOrders.map(order => (
                                    <div key={order.id} className="relative bg-gray-50 dark:bg-gray-800/50 rounded-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                                        {/* Delivered Watermark */}
                                        {order.status === 'Delivered' && (
                                            <div className="absolute right-0 bottom-0 p-4 z-0 opacity-10 pointer-events-none select-none overflow-hidden">
                                                <span className="text-6xl md:text-8xl font-black text-green-600 uppercase tracking-widest transform -rotate-12 inline-block border-8 border-green-600 rounded-xl px-6 py-2 mask-image-grunge">
                                                    DELIVERED
                                                </span>
                                            </div>
                                        )}
                                        {/* Order Header */}
                                        <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                            <div>
                                                <div className="flex items-center gap-3">
                                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order #{order.id}</h3>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                        order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                            order.status === 'Hand on Courier' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                    Placed on {new Date(order.date).toLocaleDateString()} at {new Date(order.date).toLocaleTimeString()}
                                                </p>
                                                {order.status === 'Delivered' && order.deliveredAt && (
                                                    <p className="text-sm text-green-600 dark:text-green-400 font-medium mt-0.5 animate-in fade-in slide-in-from-left-2 duration-300">
                                                        Delivered on {new Date(order.deliveredAt).toLocaleDateString()} at {new Date(order.deliveredAt).toLocaleTimeString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
                                                <p className="text-xl font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</p>
                                            </div>
                                        </div>

                                        {/* Order Items */}
                                        <div className="p-6">
                                            <div className="space-y-4">
                                                {order.items.map((item, idx) => (
                                                    <div key={idx} className="flex items-center gap-4">
                                                        <div className="h-16 w-16 bg-white dark:bg-gray-700 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
                                                            <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="font-medium text-gray-900 dark:text-white truncate">
                                                                {item.name}
                                                                {item.code && <span className="ml-2 text-xs font-mono text-gray-500 dark:text-gray-400 font-normal">({item.code})</span>}
                                                            </h4>
                                                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                                <span>Size: {item.size}</span>
                                                                {item.color && (
                                                                    <span className="flex items-center gap-1">
                                                                        Color:
                                                                        <span className="w-3 h-3 rounded-full border border-gray-300" style={{ backgroundColor: getColorCode(item.color || 'black') }}></span>
                                                                    </span>
                                                                )}
                                                                <span>Qty: {item.quantity}</span>
                                                            </div>
                                                        </div>
                                                        <div className="text-right font-medium text-gray-900 dark:text-white">
                                                            {formatPrice(item.price * item.quantity)}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default Profile;
