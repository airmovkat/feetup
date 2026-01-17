import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { useAuth } from '../../components/AuthContext';
import { useProducts } from '../../components/ProductContext';
import { useCategories } from '../../components/CategoryContext';
import { useOrders } from '../../components/OrderContext';
import { useNotification } from '../../components/NotificationContext';
import { useCurrency } from '../../components/CurrencyContext';
import { useTheme } from '../../components/ThemeContext';
import {
    LayoutDashboard, Package, ShoppingCart, Users, LogOut,
    Plus, Edit, Trash2, Check, X, Save, TrendingUp, Clock, DollarSign, Search, Filter, User, Sun, Moon, Megaphone, Crown, Menu, Footprints, Download, Calendar, RotateCcw, Printer, Percent, Truck
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { motion, AnimatePresence } from 'framer-motion';
import ProductForm from './ProductForm';
import OrderDetailsModal from './OrderDetailsModal';
import AnalyticsCharts from './AnalyticsCharts';
import CustomerDetailsModal from './CustomerDetailsModal';
import CategoriesView from './CategoriesView';
import SellersView from './SellersView';
import CouriersView from './CouriersView';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/logo1.png';

// --- Sub-Components Defined Outside to Prevent Re-renders ---

const StatsCard = ({ title, value, icon: Icon, color, delay = 0, className = '' }) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay }}
        className={`bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center hover:shadow-xl transition-all duration-300 group relative z-0 hover:z-10 h-full ${className}`}
    >
        <div className={`p-4 rounded-xl mr-5 shrink-0 ${color} shadow-sm group-hover:scale-110 transition-transform duration-300`}>
            <Icon size={28} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-600 dark:text-gray-300 mb-1 truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all duration-300 uppercase tracking-widest">{title}</p>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight truncate group-hover:whitespace-normal group-hover:overflow-visible transition-all duration-300">{value}</h3>
        </div>
    </motion.div>
);

const Overview = ({ stats, registeredUsers, orders, formatPrice }) => {
    // Calculate Guest Customers
    const safeRegisteredUsers = Array.isArray(registeredUsers) ? registeredUsers : [];
    const registeredEmails = new Set(safeRegisteredUsers.map(u => u.email));

    const guestEmails = new Set();
    (orders || []).forEach(order => {
        if (order.customer?.email && !registeredEmails.has(order.customer.email)) {
            guestEmails.add(order.customer.email);
        }
    });
    const guestCount = guestEmails.size;

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
                <StatsCard className="lg:col-span-2" title="Total Sales" value={formatPrice(stats.totalSales)} icon={DollarSign} color="bg-gradient-to-br from-green-400 to-green-600" delay={0} />
                <StatsCard className="lg:col-span-2" title="Today's Orders" value={stats.todayOrders} icon={ShoppingCart} color="bg-gradient-to-br from-blue-400 to-blue-600" delay={0.1} />
                <StatsCard className="lg:col-span-2" title="Pending Orders" value={stats.pendingOrders} icon={Clock} color="bg-gradient-to-br from-orange-400 to-orange-600" delay={0.2} />
                <StatsCard className="lg:col-span-3" title="Registered Customers" value={safeRegisteredUsers.length} icon={Users} color="bg-gradient-to-br from-purple-400 to-purple-600" delay={0.3} />
                <StatsCard className="lg:col-span-3" title="Guest Customers" value={guestCount} icon={User} color="bg-gradient-to-br from-indigo-400 to-indigo-600" delay={0.4} />
            </div>

            <AnalyticsCharts orders={orders || []} products={[]} /> {/* Empty products array passed as only orders needed for current chart implementation usually, or pass products prop if needed */}
        </div>
    );
};

const OrdersView = ({ orders, registeredUsers, updateOrderStatus, setSelectedOrder, handleDeleteOrder, formatPrice, showNotification, role = 'owner', currentUser, markLabelPrinted }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('All');
    const [dateFilter, setDateFilter] = useState('');
    const [modifiedOrders, setModifiedOrders] = useState({});

    const handleStatusChange = (orderId, newStatus, currentStatus) => {
        if (newStatus === currentStatus) {
            const { [orderId]: _, ...rest } = modifiedOrders;
            setModifiedOrders(rest);
        } else {
            setModifiedOrders(prev => ({ ...prev, [orderId]: newStatus }));
        }
    };

    const handleSaveChanges = () => {
        Object.entries(modifiedOrders).forEach(([idStr, status]) => {
            // Find the order to get the correct ID type (number vs string)
            const order = orders.find(o => String(o.id) === idStr);
            if (order) {
                // Pass current user name for tracking
                const actionBy = (status === 'Hand on Courier' || status === 'Delivered') ? (currentUser?.name || currentUser?.username) : null;
                updateOrderStatus(order.id, status, actionBy);
            }
        });
        setModifiedOrders({});
        showNotification('Order statuses updated successfully', 'success');
    };

    const getFilteredStatusCount = (status) => {
        // Base orders to filter: either all OR date-filtered if date is set
        let relevantOrders = orders;
        if (dateFilter) {
            relevantOrders = orders.filter(o => {
                const orderDate = new Date(o.date).toLocaleDateString('en-CA');
                return orderDate === dateFilter;
            });
        }

        if (status === 'All') {
            if (role === 'courier') {
                return relevantOrders.filter(o => o.status === 'Hand on Courier' || o.status === 'Delivered').length;
            }
            return relevantOrders.length;
        }
        return relevantOrders.filter(o => o.status === status).length;
    };

    // Pre-calculate registered emails for O(1) lookup
    const registeredEmails = new Set((Array.isArray(registeredUsers) ? registeredUsers : []).map(u => u.email));

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            ("#" + String(order.id)).toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === 'All' || order.status === statusFilter;

        if (role === 'courier' && order.status !== 'Hand on Courier' && order.status !== 'Delivered') {
            return false;
        }

        // Date Filter Logic
        let matchesDate = true;
        if (dateFilter) {
            // Compare YYYY-MM-DD
            const orderDate = new Date(order.date).toLocaleDateString('en-CA');
            matchesDate = orderDate === dateFilter;
        }

        return matchesSearch && matchesStatus && matchesDate;
    });

    // --- Orders View Delete Modal Included ---
    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [orderToDelete, setOrderToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');

    const handleDeleteClick = (order) => {
        setOrderToDelete(order);
        setDeletePassword('');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (deletePassword === 'admin123') {
            if (orderToDelete) {
                handleDeleteOrder(orderToDelete.id);
            }
            setIsDeleteModalOpen(false);
            setOrderToDelete(null);
        } else {
            showNotification('Incorrect password! Deletion cancelled.', 'error');
        }
    };

    // --- Courier Delivery Modal ---
    const [isDeliveryModalOpen, setIsDeliveryModalOpen] = useState(false);
    const [selectedDeliveryOrder, setSelectedDeliveryOrder] = useState(null);
    const [courierPasswordAttempt, setCourierPasswordAttempt] = useState('');

    const handleDeliveryClick = (order) => {
        setSelectedDeliveryOrder(order);
        setCourierPasswordAttempt('');
        setIsDeliveryModalOpen(true);
    };

    const confirmDelivery = () => {
        if (currentUser && currentUser.password === courierPasswordAttempt) {
            if (selectedDeliveryOrder) {
                updateOrderStatus(selectedDeliveryOrder.id, 'Delivered', currentUser?.name || currentUser?.username || 'Courier');

                // Broadcast Delivery Event
                const deliveryEvent = {
                    orderId: selectedDeliveryOrder.id,
                    customerName: selectedDeliveryOrder.customer?.name,
                    courierId: currentUser.username,
                    timestamp: Date.now()
                };
                localStorage.setItem('feetup_latest_delivery', JSON.stringify(deliveryEvent));
                // Trigger local for this tab (if testing in same tab, though less likely for real use)
                // Actually, if same tab, we don't need alert, we see the change. 
                // The prompt says "send a notification message to the Owner Dashboard".

                showNotification('Order delivered successfully!', 'success');
            }
            setIsDeliveryModalOpen(false);
            setSelectedDeliveryOrder(null);
        } else {
            showNotification('Incorrect password! Update cancelled.', 'error');
        }
    };

    const [isPrintAuthOpen, setIsPrintAuthOpen] = useState(false);
    const [labelOrder, setLabelOrder] = useState(null);
    const [printPassword, setPrintPassword] = useState('');
    const [labelTemplateData, setLabelTemplateData] = useState(null);
    const labelRef = useRef(null);

    const handlePrintClick = (order) => {
        // Strict Check: active only once. If printed, ANYONE must enter password.
        if (order.isLabelPrinted) {
            setLabelOrder(order);
            setPrintPassword('');
            setIsPrintAuthOpen(true);
        } else {
            generateAndPrintLabel(order);
        }
    };

    const confirmPrintAuth = () => {
        if (printPassword === 'admin123') {
            setIsPrintAuthOpen(false);
            generateAndPrintLabel(labelOrder);
            setLabelOrder(null);
        } else {
            showNotification('Incorrect password! Reprint denied.', 'error');
        }
    };

    const generateAndPrintLabel = (order) => {
        setLabelTemplateData(order);
        // Wait for render
        setTimeout(async () => {
            if (labelRef.current) {
                try {
                    const canvas = await html2canvas(labelRef.current, {
                        scale: 2, // Higher scale for better quality
                        useCORS: true,
                        logging: false,
                        backgroundColor: '#ffffff'
                    });
                    const imgData = canvas.toDataURL('image/jpeg', 0.9);

                    // Mark as printed globally via Context
                    if (!order.isLabelPrinted && markLabelPrinted) {
                        markLabelPrinted(order.id);
                    }

                    // Print
                    // Download as JPG
                    const link = document.createElement('a');
                    link.href = imgData;
                    const dateStr = new Date().toLocaleDateString('en-CA');
                    link.download = `FeetUp_Label_${order.id}_${dateStr}.jpg`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    showNotification('Label generated successfully', 'success');
                } catch (e) {
                    console.error("Print Error:", e);
                    showNotification('Error generating label', 'error');
                }
                setLabelTemplateData(null);
            }
        }, 500);
    };

    const handleDownloadOrdersReport = () => {
        const doc = new jsPDF();

        // --- Header ---
        doc.addImage(logo, 'PNG', 14, 10, 58, 20);
        doc.setFontSize(18); doc.setTextColor(0); doc.text("Orders Report", 196, 20, { align: 'right' });
        doc.setFontSize(10); doc.setTextColor(100); doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 26, { align: 'right' });
        doc.setDrawColor(230); doc.line(14, 32, 196, 32);

        const tableRows = filteredOrders.map(order => {
            const itemsStr = order.items ? order.items.map(i => `• ${i.name} ${i.code ? `[${i.code}] ` : ''}(${i.size}${i.color ? `, ${i.color}` : ''}) x${i.quantity}`).join('\n') : 'No items';
            const isRegistered = registeredEmails.has(order.customer?.email);
            return [
                `#${order.id}`,
                new Date(order.date).toLocaleString(),
                order.customer?.name || 'Guest',
                isRegistered ? 'Member' : 'Guest',
                itemsStr,
                order.status,
                formatPrice(order.total)
            ];
        });

        autoTable(doc, {
            startY: 40,
            head: [['Order ID', 'Date & Time', 'Customer', 'Account', 'Items', 'Status', 'Total']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22] },
            styles: { fontSize: 7, cellPadding: 2, valign: 'middle' },
            columnStyles: {
                0: { cellWidth: 22 }, // ID - Increased width
                1: { cellWidth: 35 }, // Date
                2: { cellWidth: 25 }, // Customer
                3: { cellWidth: 15 }, // Account
                4: { cellWidth: 43 }, // Items - Reduced width
                5: { cellWidth: 20 }, // Status
                6: { cellWidth: 25, halign: 'right' } // Total
            },
            margin: { top: 40, bottom: 30 },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index === 5) {
                    const status = data.cell.raw;
                    if (status === 'Delivered') data.cell.styles.textColor = [22, 163, 74];
                    else if (status === 'Cancelled') data.cell.styles.textColor = [220, 38, 38];
                    else if (status === 'Shipped' || status === 'Processing') data.cell.styles.textColor = [37, 99, 235];
                    else if (status === 'Pending') data.cell.styles.textColor = [202, 138, 4];
                }
            }
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
            doc.setDrawColor(249, 115, 22); doc.setLineWidth(1); doc.line(14, pageHeight - 20, 196, pageHeight - 20);
            doc.setFontSize(8); doc.setTextColor(100);
            doc.text("FeetUp Inc. | 123 Shoe Lane, Fashion City, FC 12345", 105, pageHeight - 14, { align: 'center' });
            doc.text("Contact: support@feetup.com | +1 (234) 567-890", 105, pageHeight - 10, { align: 'center' });
        }
        // Save
        const now = new Date();
        const dateStr = now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, '0') + "-" +
            String(now.getDate()).padStart(2, '0') + "_" +
            String(now.getHours()).padStart(2, '0') + "-" +
            String(now.getMinutes()).padStart(2, '0') + "-" +
            String(now.getSeconds()).padStart(2, '0');
        doc.save(`FeetUp_Orders_Report_${dateStr}.pdf`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 dark:shadow-xl shadow-md rounded-2xl overflow-hidden relative border border-gray-100 dark:border-transparent"
        >
            {/* Delete Confirmation Modal */}
            {createPortal(
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-gray-700 mx-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-2 text-red-600 flex items-center gap-2">
                                    <Trash2 size={20} />
                                    Delete Order
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Are you sure you want to delete Order <strong>#{orderToDelete?.id}</strong>?
                                </p>

                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 text-sm dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Enter password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!deletePassword}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* ... existing header ... */}
                <h2 className="text-xl font-bold dark:text-white">Recent Orders</h2>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            autoComplete="off"
                            placeholder="Search orders..."
                            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={18} />
                        <input
                            type="date"
                            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer"
                            value={dateFilter}
                            onChange={e => setDateFilter(e.target.value)}
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            className="pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value)}
                        >
                            <option value="All">All Status ({getFilteredStatusCount('All')})</option>
                            {role !== 'courier' && <option value="Pending">Pending ({getFilteredStatusCount('Pending')})</option>}
                            {role !== 'courier' && <option value="Processing">Processing ({getFilteredStatusCount('Processing')})</option>}
                            <option value="Hand on Courier">Hand on Courier ({getFilteredStatusCount('Hand on Courier')})</option>
                            {role !== 'courier' && <option value="Shipped">Shipped ({getFilteredStatusCount('Shipped')})</option>}
                            <option value="Delivered">Delivered ({getFilteredStatusCount('Delivered')})</option>
                            {role !== 'courier' && <option value="Cancelled">Cancelled ({getFilteredStatusCount('Cancelled')})</option>}
                        </select>
                    </div>
                    {(searchTerm || statusFilter !== 'All' || dateFilter) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setStatusFilter('All');
                                setDateFilter('');
                            }}
                            className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors shadow-sm"
                            title="Clear All Filters"
                        >
                            <RotateCcw size={18} />
                        </button>
                    )}
                    {Object.keys(modifiedOrders).length > 0 && (
                        <button
                            onClick={handleSaveChanges}
                            className="flex items-center space-x-2 px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm animate-pulse"
                            title="Save Changes"
                        >
                            <Save size={18} />
                            <span className="text-xs font-bold">Save</span>
                        </button>
                    )}
                    <button
                        onClick={handleDownloadOrdersReport}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-orange-500 hover:text-white transition-colors shadow-sm"
                        title="Export Orders PDF"
                    >
                        <Download size={20} />
                    </button>
                </div>
            </div>
            <div className="overflow-auto max-h-[calc(100vh-200px)] border-t border-gray-100 dark:border-white/10">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-200 dark:bg-white/40 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Order ID</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Customer</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Account</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Total</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody key={searchTerm + statusFilter + dateFilter} className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-transparent">
                        {filteredOrders.length === 0 ? (
                            <tr><td colSpan="6" className="px-6 py-8 text-center text-gray-500">No orders found matching your filters</td></tr>
                        ) : filteredOrders.map((order, index) => {
                            const isRegistered = registeredEmails.has(order.customer?.email);
                            const orderDate = new Date(order.date);
                            const now = new Date();
                            const diffTime = Math.abs(now - orderDate);
                            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                            const isUrgent = order.status === 'Pending' && diffDays > 7;

                            return (
                                <motion.tr
                                    key={order.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ duration: 0.2, delay: index * 0.05 }}
                                    className={`border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors ${isUrgent ? 'border-2 border-red-500 dark:border-red-400 animate-[pulse_2s_cubic-bezier(0.4,0,0.6,1)_infinite] bg-red-50 dark:bg-red-900/40 shadow-[inset_0_0_10px_rgba(239,68,68,0.2)] dark:shadow-[inset_0_0_15px_rgba(248,113,113,0.3)]' : ''
                                        }`}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium dark:text-white">#{order.id}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{new Date(order.date).toLocaleString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                        <div className="font-medium">{order.customer?.name}</div>
                                        <div className="text-xs text-gray-400">{order.customer?.email}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wide border ${isRegistered
                                            ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-900/20 dark:text-purple-400 dark:border-purple-800'
                                            : 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800'
                                            }`}>
                                            {isRegistered ? 'Member' : 'Guest'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white">{formatPrice(order.total)}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {((role === 'seller' && (order.status === 'Shipped' || order.status === 'Delivered')) || (role === 'courier' && order.status === 'Delivered')) ? (
                                            <span className={`text-xs font-bold rounded-full px-3 py-1 border border-transparent ${order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                                                order.status === 'Hand on Courier' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-green-100 text-green-800'
                                                }`}>
                                                {order.status}
                                            </span>
                                        ) : (
                                            <select
                                                value={modifiedOrders[order.id] || order.status}
                                                onChange={(e) => handleStatusChange(order.id, e.target.value, order.status)}
                                                className={`text-xs font-semibold rounded-full px-3 py-1 border-none focus:ring-2 focus:ring-offset-2 outline-none ${role === 'courier' ? 'cursor-not-allowed disabled:opacity-100' : 'cursor-pointer'} ${(modifiedOrders[order.id] || order.status) === 'Delivered' && role === 'courier' ? 'appearance-none' : ''} ${(modifiedOrders[order.id] || order.status) === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    (modifiedOrders[order.id] || order.status) === 'Delivered' ? 'bg-green-100 text-green-800' :
                                                        (modifiedOrders[order.id] || order.status) === 'Hand on Courier' ? 'bg-purple-100 text-purple-800' :
                                                            (modifiedOrders[order.id] || order.status) === 'Cancelled' ? 'bg-red-100 text-red-800' :
                                                                'bg-blue-100 text-blue-800'
                                                    }`}
                                                disabled={role === 'courier'}
                                            >
                                                <option value="Pending">Pending</option>
                                                <option value="Processing">Processing</option>
                                                <option value="Hand on Courier">Hand on Courier</option>
                                                {role !== 'seller' && <option value="Shipped">Shipped</option>}
                                                {role !== 'seller' && <option value="Delivered">Delivered</option>}
                                                <option value="Cancelled">Cancelled</option>
                                            </select>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-700 dark:text-primary-400 font-medium">
                                        <div className="flex items-center gap-3">
                                            {role !== 'courier' && (
                                                <button
                                                    type="button"
                                                    onClick={() => setSelectedOrder(order)}
                                                    className="hover:text-primary-900 underline disabled:opacity-50"
                                                >
                                                    View Details
                                                </button>
                                            )}
                                            {role === 'owner' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handleDeleteClick(order)}
                                                    className="p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                    title="Delete Order"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                            {/* Courier Status Button */}
                                            {role === 'courier' && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        if (order.status !== 'Delivered') {
                                                            handleDeliveryClick(order);
                                                        }
                                                    }}
                                                    className={`px-3 py-1 rounded-full text-white text-xs font-semibold shadow-sm transition-colors ${order.status === 'Delivered'
                                                        ? 'bg-green-500 cursor-default'
                                                        : 'bg-orange-500 hover:bg-orange-600'
                                                        }`}
                                                    disabled={order.status === 'Delivered'}
                                                >
                                                    {order.status === 'Delivered' ? 'Delivered' : 'Status'}
                                                </button>
                                            )}
                                            {role !== 'courier' && (
                                                <button
                                                    type="button"
                                                    onClick={() => handlePrintClick(order)}
                                                    className={`p-2 rounded-full transition-colors ${order.isLabelPrinted
                                                        ? 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                                                        : 'text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20'
                                                        }`}
                                                    title={order.isLabelPrinted ? "Reprint Label (Auth Required)" : "Print Label"}
                                                >
                                                    <Printer size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </motion.tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            {/* Courier Delivery Auth Modal */}
            {createPortal(
                <AnimatePresence>
                    {isDeliveryModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                            onClick={() => setIsDeliveryModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-gray-700 mx-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-2 text-primary-600 flex items-center gap-2">
                                    <Truck size={20} />
                                    Confirm Delivery
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Are you sure you want to update the order status?
                                </p>

                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Enter Your Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 text-sm dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Password"
                                    value={courierPasswordAttempt}
                                    onChange={e => setCourierPasswordAttempt(e.target.value)}
                                    autoFocus
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsDeliveryModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelivery}
                                        className="px-4 py-2 text-sm font-bold text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                        disabled={!courierPasswordAttempt}
                                    >
                                        Confirm
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Print Auth Modal */}
            {createPortal(
                <AnimatePresence>
                    {isPrintAuthOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                            onClick={() => setIsPrintAuthOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-gray-700 mx-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-2 text-primary-600 flex items-center gap-2">
                                    <Printer size={20} />
                                    Reprint Label
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Label already printed. Enter password to reprint <strong>#{labelOrder?.id}</strong>.
                                </p>

                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 text-sm dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                    placeholder="Enter password"
                                    value={printPassword}
                                    onChange={e => setPrintPassword(e.target.value)}
                                    autoFocus
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsPrintAuthOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmPrintAuth}
                                        className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                        disabled={!printPassword}
                                    >
                                        Reprint
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Hidden Label Template for Generation */}
            <div className="fixed top-0 left-0 overflow-hidden pointer-events-none opacity-0">
                {labelTemplateData && (
                    <div ref={labelRef} className="bg-white text-black p-4 relative flex flex-col box-border font-sans" style={{ width: '560px', height: '375px' }}>
                        <div className="border-4 border-black h-full w-full flex flex-col p-4 relative">
                            {/* Top Header Row */}
                            <div className="flex justify-between items-start mb-4">
                                {/* Logo Section (Fixed for Print) */}
                                <div className="flex items-center gap-2 transform origin-top-left scale-90">
                                    <div className="bg-gradient-to-r from-orange-500 to-red-600 p-1.5 rounded-lg flex items-center justify-center">
                                        <Footprints className="text-white w-6 h-6" strokeWidth={2.5} />
                                    </div>
                                    <span className="text-2xl font-bold text-orange-600 tracking-tight leading-none -mt-1">FeetUp</span>
                                </div>

                                {/* Order ID */}
                                <div className="text-right">
                                    <h1 className="text-3xl font-black uppercase tracking-wider mb-0.5">#{labelTemplateData.id}</h1>
                                    <p className="text-[10px] font-bold text-gray-500 tracking-[0.3em]">ORDER ID</p>
                                </div>
                            </div>

                            {/* Content Row with Divider */}
                            <div className="flex gap-4 flex-grow items-start border-t border-b border-gray-100 py-3 my-1">
                                {/* FROM Section */}
                                <div className="w-1/2 border-r-2 border-dashed border-gray-300 pr-3 h-full">
                                    <h3 className="font-bold text-xs uppercase text-gray-400 mb-2 tracking-wider">From:</h3>
                                    <div className="pl-1 space-y-1 text-sm text-gray-800">
                                        <p className="font-bold text-gray-900 text-base">FeetUp Inc.</p>
                                        <p>123 Shoe Lane</p>
                                        <p>Fashion City, FC 12345</p>
                                        <p className="font-medium mt-1">+1 (234) 567-890</p>
                                    </div>
                                </div>

                                {/* TO Section */}
                                <div className="w-1/2 pl-1 h-full">
                                    <h3 className="font-bold text-xs uppercase text-gray-400 mb-2 tracking-wider">To:</h3>
                                    <div className="pl-1 space-y-1 text-sm text-gray-800">
                                        <p className="font-bold text-gray-900 text-xl leading-tight mb-1">{labelTemplateData.customer?.name || 'Valued Customer'}</p>
                                        <p className="text-gray-600 break-words leading-snug">{labelTemplateData.customer?.email}</p>

                                        <div className="mt-2 text-gray-800 leading-snug">
                                            <p className="font-medium">{labelTemplateData.customer?.city || 'City'}</p>
                                            <p>{labelTemplateData.customer?.address || 'Shipping Address'}</p>
                                            {/* Postal Code Added */}
                                            {labelTemplateData.customer?.zip && (
                                                <p className="text-gray-900 mt-0.5">ZIP: {labelTemplateData.customer.zip}</p>
                                            )}
                                        </div>

                                        <p className="font-medium mt-2">{labelTemplateData.customer?.phone || 'No Phone'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Footer / QR Code */}
                            <div className="mt-auto flex flex-col items-center justify-center pt-2">
                                <img
                                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent('https://wa.me/94771981273')}`}
                                    alt="QR Code"
                                    className="w-14 h-14 mb-1"
                                    crossOrigin="anonymous"
                                />
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.2em]">Scan to Contact Us</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    );
};

const ProductsView = ({ products, modifiedProducts, toggleFeatured, toggleSale, onEditProduct, onDeleteClick, handleBatchUpdate, formatPrice, hasChanges, setEditingProduct, setIsFormOpen, showNotification, updateProduct, setModifiedProducts, role = 'owner' }) => {
    const { categories } = useCategories();
    const [searchTerm, setSearchTerm] = useState('');
    const [genderFilter, setGenderFilter] = useState('All');
    const [showDiscountedOnly, setShowDiscountedOnly] = useState(false);

    const handleDownloadProductsReport = () => {
        const doc = new jsPDF();

        // --- Header ---
        doc.addImage(logo, 'PNG', 14, 10, 58, 20);

        doc.setFontSize(18);
        doc.setTextColor(0);
        doc.text("Inventory Report", 196, 20, { align: 'right' });

        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 26, { align: 'right' });

        doc.setDrawColor(230);
        doc.line(14, 32, 196, 32);

        const tableRows = filteredProducts.map(p => [
            p.code || 'N/A',
            p.name,
            p.gender,
            p.category,
            formatPrice(p.price),
            p.isFeatured ? 'Yes' : 'No',
            p.isOnSale ? 'Yes' : 'No'
        ]);

        autoTable(doc, {
            startY: 40,
            head: [['Code', 'Name', 'Gender', 'Category', 'Price', 'Featured', 'Sale']],
            body: tableRows,
            theme: 'grid',
            headStyles: { fillColor: [249, 115, 22] },
            styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
            margin: { top: 40, bottom: 30 },
        });

        const pageCount = doc.internal.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
            doc.setDrawColor(249, 115, 22); doc.setLineWidth(1); doc.line(14, pageHeight - 20, 196, pageHeight - 20);
            doc.setFontSize(8); doc.setTextColor(100);
            doc.text("FeetUp Inc. | 123 Shoe Lane, Fashion City, FC 12345", 105, pageHeight - 14, { align: 'center' });
            doc.text("Contact: support@feetup.com | +1 (234) 567-890", 105, pageHeight - 10, { align: 'center' });
        }
        // Save
        const now = new Date();
        const dateStr = now.getFullYear() + "-" +
            String(now.getMonth() + 1).padStart(2, '0') + "-" +
            String(now.getDate()).padStart(2, '0') + "_" +
            String(now.getHours()).padStart(2, '0') + "-" +
            String(now.getMinutes()).padStart(2, '0') + "-" +
            String(now.getSeconds()).padStart(2, '0');
        doc.save(`FeetUp_Inventory_Report_${dateStr}.pdf`);
    };

    const getCurrentValue = (productId, field) => {
        const product = products.find(p => p.id === productId);
        return modifiedProducts[productId]?.[field] ?? product[field];
    };

    const filteredProducts = products.filter(product => {
        const matchesSearch = (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (product.code && product.code.toLowerCase().includes(searchTerm.toLowerCase())));

        const matchesGender = genderFilter === 'All' || product.gender === genderFilter;

        const currentDiscount = modifiedProducts[product.id]?.discountPercentage ?? product.discountPercentage ?? 0;
        const matchesDiscount = showDiscountedOnly
            ? currentDiscount > 0
            : true;

        return matchesSearch && matchesGender && matchesDiscount;
    });

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 dark:shadow-xl shadow-md rounded-2xl overflow-hidden relative border border-gray-100 dark:border-transparent"
        >

            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
                <h2 className="text-xl font-bold dark:text-white">Product Inventory</h2>
                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                    {/* Search & Filter Controls */}
                    <div className="relative flex-grow sm:flex-grow-0">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            autoComplete="off"
                            placeholder="Search by Name or Code..."
                            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none w-full sm:w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="relative flex-grow sm:flex-grow-0">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            className="pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none cursor-pointer w-full"
                            value={genderFilter}
                            onChange={e => setGenderFilter(e.target.value)}
                        >
                            <option value="All">All Genders</option>
                            {categories.mainCategories.map(cat => (
                                <option key={cat.id} value={cat.id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>

                    <button
                        onClick={() => setShowDiscountedOnly(!showDiscountedOnly)}
                        className={`p-2 rounded-lg border transition-colors ${showDiscountedOnly
                            ? 'bg-orange-100 border-orange-200 text-orange-600 dark:bg-orange-900/30 dark:border-orange-800 dark:text-orange-400'
                            : 'bg-gray-50 border-gray-200 text-gray-500 dark:bg-gray-900 dark:border-gray-700 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                            }`}
                        title="Show Discounted Only"
                    >
                        <Percent size={20} />
                    </button>

                    {(searchTerm || genderFilter !== 'All' || showDiscountedOnly) && (
                        <button
                            onClick={() => {
                                setSearchTerm('');
                                setGenderFilter('All');
                                setShowDiscountedOnly(false);
                            }}
                            className="flex items-center space-x-2 px-3 py-2 bg-red-50 text-red-600 rounded-md hover:bg-red-100 transition-colors shadow-sm"
                            title="Clear All Filters"
                        >
                            <RotateCcw size={18} />
                        </button>
                    )}

                    <div className="flex gap-2">
                        {hasChanges && (
                            <button type="button" onClick={handleBatchUpdate} className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors shadow-sm whitespace-nowrap animate-pulse">
                                <Save size={20} /> <span className="hidden sm:inline">Update</span>
                            </button>
                        )}
                        {role === 'owner' && (
                            <button type="button" onClick={() => { setEditingProduct(null); setIsFormOpen(true); }} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap">
                                <Plus size={20} /> <span className="hidden sm:inline">Add Product</span>
                            </button>
                        )}
                        <button
                            onClick={handleDownloadProductsReport}
                            className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-orange-500 hover:text-white transition-colors shadow-sm"
                            title="Export Inventory PDF"
                        >
                            <Download size={20} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="overflow-auto max-h-[calc(100vh-200px)] border-t border-gray-100 dark:border-white/10">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="bg-gray-200 dark:bg-white/40 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Product Code</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Product</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Gender</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Category</th>
                            <th className="px-6 py-3 text-left text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Price</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Stock</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Purchased</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Featured</th>
                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Discount</th>
                            {role === 'owner' && <th className="px-6 py-3 text-right text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Actions</th>}
                        </tr>
                    </thead>
                    <tbody key={searchTerm + genderFilter + showDiscountedOnly} className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-transparent">
                        {filteredProducts.length === 0 ? (
                            <tr><td colSpan={role === 'owner' ? "9" : "8"} className="px-6 py-8 text-center text-gray-500">No products found matching your search.</td></tr>
                        ) : filteredProducts.map((product, index) => (
                            <motion.tr
                                key={product._id || product.id || index}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.05 }}
                                className={`${modifiedProducts[product.id] ? 'bg-yellow-50 dark:bg-yellow-900/10' : ''} ${(role === 'owner' || role === 'seller') && (product.stock || 0) === 0 ? 'animate-pulse bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900' : 'hover:bg-gray-50 dark:hover:bg-white/5'} border-b border-gray-100 dark:border-white/10 transition-colors`}
                            >
                                <td className="px-6 py-4 whitespace-nowrap text-xs font-mono font-bold text-gray-700 dark:text-gray-300 relative overflow-hidden">
                                    {product.code || 'N/A'}
                                    {/* Out of Stock Ribbon */}
                                    {(product.stock || 0) === 0 && (
                                        <div className="absolute top-0 left-0">
                                            <div className="bg-red-600 text-white text-[8px] font-bold px-2 py-0.5 shadow-md transform -rotate-45 translate-x-[-26px] translate-y-[5px] w-[90px] text-center border-y border-red-400">
                                                OUT OF STOCK
                                            </div>
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="flex items-center">
                                        <div className="h-10 w-10 flex-shrink-0 relative">
                                            <img className="h-10 w-10 rounded-full object-cover" src={product.image} alt="" />
                                        </div>
                                        <div className="ml-4">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white flex items-center gap-2">
                                                {product.name}
                                                {getCurrentValue(product.id, 'isOnSale') && (
                                                    <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded border border-red-200">
                                                        -{getCurrentValue(product.id, 'discountPercentage') || 20}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.gender === 'men' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                        product.gender === 'women' ? 'bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300' :
                                            product.gender === 'kids' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                                        }`}>
                                        {categories.mainCategories.find(c => c.id === product.gender)?.name || product.gender}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                                        {product.category}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-300">
                                    {formatPrice(product.price)}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white text-center">
                                    {product.stock || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-600 dark:text-green-400">
                                    {product.purchased || 0}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <div className={`flex justify-center ${role !== 'owner' ? 'cursor-not-allowed' : ''}`}>
                                        <input
                                            type="checkbox"
                                            checked={getCurrentValue(product.id, 'isFeatured')}
                                            onChange={() => role === 'owner' && toggleFeatured(product.id)}
                                            className={`h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${role === 'owner' ? 'cursor-pointer' : 'pointer-events-none'}`}
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                    <select
                                        className="border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-white text-xs rounded px-2 py-1 focus:ring-2 focus:ring-primary-500 outline-none disabled:opacity-70 disabled:cursor-not-allowed"
                                        value={getCurrentValue(product.id, 'discountPercentage') || 0}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value, 10);
                                            const newIsOnSale = val > 0;

                                            setModifiedProducts(prev => {
                                                const currentMod = { ...(prev[product.id] || {}) };

                                                // Handle Discount Percentage
                                                if (val === (product.discountPercentage || 0)) {
                                                    delete currentMod.discountPercentage;
                                                } else {
                                                    currentMod.discountPercentage = val;
                                                }

                                                // Handle isOnSale (automatically derived from discount)
                                                if (newIsOnSale === (product.isOnSale || false)) {
                                                    delete currentMod.isOnSale;
                                                } else {
                                                    currentMod.isOnSale = newIsOnSale;
                                                }

                                                // Cleanup if empty
                                                if (Object.keys(currentMod).length === 0) {
                                                    const { [product.id]: _, ...rest } = prev;
                                                    return rest;
                                                }
                                                return { ...prev, [product.id]: currentMod };
                                            });
                                        }}
                                        disabled={role !== 'owner'}
                                    >
                                        <option value="0">None</option>
                                        <option value="10">10%</option>
                                        <option value="15">15%</option>
                                        <option value="20">20%</option>
                                        <option value="25">25%</option>
                                        <option value="30">30%</option>
                                    </select>
                                </td>
                                {role === 'owner' && (
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex justify-end gap-2">
                                            <button
                                                type="button"
                                                onClick={() => onEditProduct(product)}
                                                className="p-2 text-gray-700 dark:text-gray-300 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full transition-colors"
                                                title="Edit"
                                            >
                                                <Edit size={16} />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => onDeleteClick(product)}
                                                className="p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                                title="Delete"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </motion.div >
    );
};

const CustomersView = ({ registeredUsers, orders, setSelectedCustomer, currentUser, showNotification, deleteUser, formatPrice, deleteOrder }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);
    const [offerMessage, setOfferMessage] = useState('');

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [customerToDelete, setCustomerToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');

    const handleDeleteClick = (customer) => {
        setCustomerToDelete(customer);
        setDeletePassword(''); // Reset password field
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        // Hardcoded password for safety
        if (deletePassword === 'admin123') {
            if (customerToDelete) {
                if (customerToDelete.isGuest) {
                    // Start logic for Guest Deletion: Delete all their orders
                    try {
                        const guestOrders = orders.filter(o => o.customer?.email?.toLowerCase() === customerToDelete.email.toLowerCase());

                        // Delete all orders in parallel
                        await Promise.all(guestOrders.map(o => deleteOrder(o.id)));

                        showNotification(`Guest and ${guestOrders.length} order(s) deleted`, 'success');
                    } catch (err) {
                        console.error("Failed to delete guest orders", err);
                        showNotification('Failed to delete guest data', 'error');
                    }
                } else {
                    // Registered User Deletion
                    deleteUser(customerToDelete._id || customerToDelete.id);
                    showNotification('Customer deleted successfully', 'success');
                }
            }
            setIsDeleteModalOpen(false);
            setCustomerToDelete(null);
        } else {
            showNotification('Incorrect password! Deletion cancelled.', 'error');
        }
    };

    const handleSendOffer = () => {
        if (!offerMessage.trim()) return;

        const broadcastData = {
            id: Date.now(),
            message: offerMessage,
            target: filterStatus === 'all' ? 'all' : filterStatus
        };

        // Write to localStorage to trigger event in other tabs
        localStorage.setItem('marketing_broadcast', JSON.stringify(broadcastData));

        // Dispatch local storage event manually for current tab testing
        window.dispatchEvent(new StorageEvent('storage', {
            key: 'marketing_broadcast',
            newValue: JSON.stringify(broadcastData)
        }));

        showNotification('Offer sent to active users!', 'success');
        setOfferMessage('');
        setIsOfferModalOpen(false);
    };

    // Combine registered users with order customers (deduplicate by email)
    // This handles both signed-up users AND guests who checked out
    // Safety check: ensure registeredUsers is an array
    const allCustomers = [...(Array.isArray(registeredUsers) ? registeredUsers : [])];

    // Add guest customers from orders if they aren't in registered list
    (orders || []).forEach(order => {
        const email = order.customer?.email;
        // Case-insensitive check for existing user
        if (email && !allCustomers.find(u => u.email.toLowerCase() === email.toLowerCase())) {
            allCustomers.push({
                id: `guest-${email}`, // Pseudo-ID for deletion logic
                name: order.customer.name,
                email: order.customer.email,
                phone: order.customer.phone,
                address: order.customer.address,
                city: order.customer.city,
                zip: order.customer.zip,
                isGuest: true
            });
        }
    });

    const filteredCustomers = allCustomers.filter(c => {
        const matchesSearch = (c.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (c.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (c.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase());

        if (!matchesSearch) return false;

        if (filterStatus === 'active') return c.isOnline === 1;
        if (filterStatus === 'registered') return !c.isGuest;
        if (filterStatus === 'guest') return c.isGuest;

        return true;
    });

    const handleDownloadReport = () => {
        try {
            const doc = new jsPDF();

            // --- Header ---
            // Logo Graphic (Shoe Prints)
            doc.setFillColor(249, 115, 22); // Primary Orange
            doc.roundedRect(14, 12, 12, 12, 3, 3, 'F'); // Background box

            doc.setFillColor(255, 255, 255); // White for feet

            // Left Foot
            doc.ellipse(17.5, 20.5, 0.8, 1.0, 'F');
            doc.ellipse(17.8, 18.2, 1.0, 1.5, 'F');

            // Right Foot
            doc.ellipse(21.5, 16.5, 0.8, 1.0, 'F');
            doc.ellipse(21.8, 14.2, 1.0, 1.5, 'F');

            // Company Name
            doc.setFont("helvetica", "bold");
            doc.setFontSize(24);
            doc.setTextColor(249, 115, 22);
            doc.text("FeetUp", 30, 21);

            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(100);
            doc.text("Premium Footwear", 30, 26);

            // Document Title
            doc.setFontSize(18);
            doc.setTextColor(0);
            doc.text("Customer Database Report", 196, 20, { align: 'right' });

            // Date
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 26, { align: 'right' });

            // Separator Line
            doc.setDrawColor(230);
            doc.line(14, 32, 196, 32);

            // --- Customer Details Loop ---
            // Start content Y position
            let currentY = 50;

            filteredCustomers.forEach((c, index) => {
                // Check if we need a new page for the header (heuristic)
                if (currentY > 250) {
                    doc.addPage();
                    currentY = 20;
                }

                // Customer Header
                doc.setFontSize(12);
                doc.setTextColor(249, 115, 22); // Orange header
                doc.setFont("helvetica", "bold");
                doc.text(`${index + 1}. Customer Details`, 14, currentY);
                currentY += 6;

                doc.setFontSize(10);
                doc.setTextColor(50);
                doc.setFont("helvetica", "bold");

                // Labels Column
                doc.text("Full Name:", 14, currentY);
                doc.text("Email:", 14, currentY + 5);
                doc.text("Phone No:", 14, currentY + 10);
                doc.text("Address:", 14, currentY + 15);
                doc.text("City:", 14, currentY + 20);

                // Values Column
                doc.setFont("helvetica", "normal");
                doc.setTextColor(80);
                doc.text(`${c.name || 'Unknown'} (${c.isGuest ? 'Guest' : 'Member'})`, 40, currentY);
                doc.text(c.email || 'N/A', 40, currentY + 5);
                doc.text(c.phone || 'N/A', 40, currentY + 10);
                doc.text(c.address || 'N/A', 40, currentY + 15);
                doc.text(`${c.city || 'N/A'} ${c.zip ? `(${c.zip})` : ''}`, 40, currentY + 20);

                // Calculate Total Spent
                const cOrders = orders.filter(o => o.customer?.email === c.email);
                const totalSpent = cOrders.reduce((sum, o) => sum + (o.total || 0), 0);

                doc.setTextColor(50);
                doc.setFont("helvetica", "bold");
                doc.text("Total Spend:", 14, currentY + 25);
                doc.setFont("helvetica", "normal");
                doc.setTextColor(22, 163, 74); // Green color for money
                doc.text(formatPrice(totalSpent), 40, currentY + 25);

                currentY += 35; // Space after header

                if (cOrders.length > 0) {
                    const orderRows = cOrders.map(o => {
                        // Format items with newlines for cleaner table
                        const itemsStr = o.items ? o.items.map(i => `• ${i.name} ${i.code ? `[${i.code}] ` : ''}(${i.size}${i.color ? `, ${i.color}` : ''}) x${i.quantity}`).join('\n') : 'No items';

                        return [
                            `#${o.id}`,
                            new Date(o.date).toLocaleString(),
                            itemsStr,
                            o.status,
                            formatPrice(o.total || 0)
                        ];
                    });

                    autoTable(doc, {
                        startY: currentY,
                        head: [['Order ID', 'Date & Time', 'Items', 'Status', 'Total']],
                        body: orderRows,
                        theme: 'grid',
                        headStyles: { fillColor: [249, 115, 22] }, // Orange for table headers
                        styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
                        columnStyles: {
                            0: { cellWidth: 20 },
                            1: { cellWidth: 35 },
                            2: { cellWidth: 80 }, // Wide column for items
                            3: { cellWidth: 25 },
                            4: { cellWidth: 20, halign: 'right' }
                        },
                        margin: { left: 14, right: 14, bottom: 30 },
                        didParseCell: function (data) {
                            if (data.section === 'body' && data.column.index === 3) {
                                const status = data.cell.raw;
                                if (status === 'Delivered') {
                                    data.cell.styles.textColor = [22, 163, 74]; // Green
                                } else if (status === 'Cancelled') {
                                    data.cell.styles.textColor = [220, 38, 38]; // Red
                                } else if (status === 'Shipped' || status === 'Processing') {
                                    data.cell.styles.textColor = [37, 99, 235]; // Blue
                                } else if (status === 'Pending') {
                                    data.cell.styles.textColor = [202, 138, 4]; // Yellow/Orange
                                }
                            }
                        },
                        // Update currentY after table
                        didDrawPage: (data) => {
                            // This hook handles page breaks automatically for the table
                        }
                    });

                    // Update Y for next customer
                    currentY = doc.lastAutoTable.finalY + 15;
                } else {
                    doc.setFontSize(9);
                    doc.setTextColor(150);
                    doc.text("No orders found.", 14, currentY);
                    currentY += 15;
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

            doc.save('FeetUp_Customers_Report.pdf');
        } catch (error) {
            console.error("PDF generation failed:", error);
            showNotification('Failed to export PDF', 'error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 shadow-xl rounded-2xl p-6 relative border border-gray-100 dark:border-transparent"
        >
            {/* Offer Modal */}
            {createPortal(
                isOfferModalOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm" onClick={() => setIsOfferModalOpen(false)}>
                        <div
                            className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-md border border-gray-100 dark:border-gray-700 mx-4"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
                                <Megaphone size={20} className="text-primary-600" />
                                Send Real-time Offer
                            </h3>
                            <p className="text-sm text-gray-500 mb-4">
                                This will appear instantly for <strong>{filterStatus === 'all' ? 'All' : filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}</strong> users currently online.
                            </p>
                            <textarea
                                className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 text-sm dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                rows="3"
                                placeholder="Enter offer message (e.g., 'Flash Sale! Use code SHOE50')"
                                value={offerMessage}
                                onChange={e => setOfferMessage(e.target.value)}
                            />
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setIsOfferModalOpen(false)}
                                    className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleSendOffer}
                                    className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
                                >
                                    Send Broadcast
                                </button>
                            </div>
                        </div>
                    </div>
                ),
                document.body
            )}

            {/* Delete Confirmation Modal */}
            {createPortal(
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-gray-700 mx-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-2 text-red-600 flex items-center gap-2">
                                    <Trash2 size={20} />
                                    Confirm Deletion
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Are you sure you want to delete <strong>{customerToDelete?.name}</strong>? This action cannot be undone.
                                </p>

                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Seller Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 text-sm dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Enter password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!deletePassword}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <h2 className="text-xl font-bold dark:text-white">Customer Database</h2>
                <div className="flex gap-3 flex-wrap md:flex-nowrap">
                    <button
                        onClick={() => setIsOfferModalOpen(true)}
                        className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-primary-600 to-primary-500 text-white text-sm font-bold rounded-lg shadow-sm hover:shadow-md transition-all active:scale-95"
                    >
                        <Megaphone size={16} />
                        Send Offer
                    </button>
                    <button
                        onClick={handleDownloadReport}
                        className="flex items-center space-x-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-orange-500 hover:text-white transition-colors shadow-sm"
                        title="Export Customer PDF"
                    >
                        <Download size={20} />
                    </button>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <select
                            className="pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none appearance-none cursor-pointer"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value)}
                        >
                            <option value="all">All Members</option>
                            <option value="active">Active Now</option>
                            <option value="registered">Registered</option>
                            <option value="guest">Guest</option>
                        </select>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            autoComplete="off"
                            placeholder="Search customers..."
                            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none w-full md:w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            {filteredCustomers.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Users size={48} className="mx-auto mb-4 opacity-50" />
                    <p>No customers found matching your search.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCustomers.map((customer, idx) => {
                        const isOnline = !!customer.isOnline;
                        return (
                            <div
                                key={idx}
                                onClick={() => setSelectedCustomer(customer)}
                                className="border border-gray-100 dark:border-white/20 px-4 pb-4 pt-9 rounded-2xl flex items-start space-x-4 bg-gray-50 dark:bg-white/10 dark:backdrop-blur-md hover:shadow-lg transition-all relative overflow-hidden cursor-pointer hover:border-primary-200 dark:hover:border-primary-500/50"
                            >
                                {customer.isGuest && (
                                    <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 text-[10px] px-2 py-1 rounded-bl-lg font-bold">
                                        GUEST
                                    </div>
                                )}
                                {isOnline && (
                                    <div className="absolute top-0 left-0 flex items-center gap-1 bg-green-100 text-green-600 text-[10px] px-2 py-1 rounded-br-lg font-bold z-10">
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        ACTIVE
                                    </div>
                                )}
                                {customer.profile_picture ? (
                                    <div className="h-14 w-14 rounded-full shadow-sm overflow-hidden shrink-0">
                                        <img src={customer.profile_picture} alt={customer.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm h-14 w-14 flex items-center justify-center shrink-0">
                                        <Users className="text-primary-500" size={24} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">{customer.name || 'Unknown User'}</h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-0.5">{customer.email}</p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">{customer.phone || 'No phone'}</p>
                                    {customer.city && (
                                        <p className="text-xs font-bold text-gray-700 dark:text-gray-300 mt-2 uppercase tracking-wide">{customer.city}</p>
                                    )}

                                    {/* Status Badge */}
                                    {!customer.isGuest ? (
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                                            Registered
                                        </span>
                                    ) : (
                                        <span className="inline-block mt-2 px-2 py-0.5 bg-orange-100 text-orange-700 text-xs rounded-full">
                                            Guest
                                        </span>
                                    )}

                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeleteClick(customer);
                                        }}
                                        className="absolute bottom-3 right-3 p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors z-10"
                                        title={customer.isGuest ? "Delete Guest & Orders" : "Delete Customer Account"}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </motion.div>
    );
};

const ClubMembersView = ({ showNotification }) => {
    const [members, setMembers] = useState([]);

    useEffect(() => {
        const loadMembers = async () => {
            try {
                const res = await fetch('/api/newsletter/subscribers');
                if (res.ok) {
                    const data = await res.json();
                    setMembers(data);
                }
            } catch (err) {
                console.error("Error loading members", err);
            }
        };
        loadMembers();

        const handleStorageChange = (e) => {
            if (e.key === 'newsletter_sync_event') {
                loadMembers();
                showNotification('New Club Member joined!', 'success');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [showNotification]);

    const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
    const [emailSubject, setEmailSubject] = useState('');
    const [emailBody, setEmailBody] = useState('');

    const handleSendEmail = () => {
        if (members.length === 0) {
            alert('No members to send email to.');
            return;
        }

        const bccList = members.map(m => m.email).join(',');
        // Privacy Best Practice: Use "BCC" to hide recipient emails from each other.
        const mailtoLink = `mailto:?bcc=${bccList}&subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

        // Open in a new tab/window so the user doesn't lose their place in the dashboard
        window.open(mailtoLink, '_blank');
        setIsEmailModalOpen(false);
        setEmailSubject('');
        setEmailBody('');
    };

    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [memberToDelete, setMemberToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');

    const handleDeleteClick = (member) => {
        setMemberToDelete(member);
        setDeletePassword('');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (deletePassword === 'admin123') {
            if (memberToDelete) {
                try {
                    const res = await fetch(`/api/newsletter/subscribers/${memberToDelete.id}`, { method: 'DELETE' });
                    if (res.ok) {
                        setMembers(prev => prev.filter(m => m.id !== memberToDelete.id));
                        showNotification('Member removed successfully', 'success');
                    } else {
                        showNotification('Failed to remove member', 'error');
                    }
                } catch (e) {
                    console.error("Delete failed", e);
                    showNotification('Error removing member', 'error');
                }
            }
            setIsDeleteModalOpen(false);
            setMemberToDelete(null);
        } else {
            showNotification('Incorrect password! Deletion cancelled.', 'error');
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 shadow-xl rounded-2xl p-6 relative border border-gray-100 dark:border-transparent"
        >
            {/* Delete Confirmation Modal */}
            {createPortal(
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-gray-700 mx-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-2 text-red-600 flex items-center gap-2">
                                    <Trash2 size={20} />
                                    Remove Member
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Are you sure you want to remove <strong>{memberToDelete?.email}</strong> from the club?
                                </p>

                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Password</label>
                                <input
                                    type="password"
                                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 text-sm dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Enter password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!deletePassword}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                    <Crown className="text-yellow-500" />
                    FeetUp Club Members
                </h2>
                {members.length > 0 && (
                    <button
                        onClick={() => setIsEmailModalOpen(true)}
                        className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-sm"
                    >
                        <Megaphone size={20} /> <span>Send Newsletter</span>
                    </button>
                )}
            </div>

            {members.length === 0 ? (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <Crown size={48} className="mx-auto mb-4 opacity-30 text-yellow-500" />
                    <p>No club members yet.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                        <thead className="bg-gray-50 dark:bg-white/5">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Date Joined</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-transparent">
                            {members.map((member, idx) => (
                                <tr key={idx} className="border-b border-gray-100 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white font-medium">
                                        {member.email}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                        {new Date(member.created_at || member.date).toLocaleDateString()} at {new Date(member.created_at || member.date).toLocaleTimeString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleDeleteClick(member)}
                                            className="p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                                            title="Remove Member"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Email Modal */}
            {createPortal(
                <AnimatePresence>
                    {isEmailModalOpen && (
                        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
                            >
                                <div className="p-6 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Compose Newsletter</h3>
                                    <button
                                        onClick={() => setIsEmailModalOpen(false)}
                                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <X size={20} />
                                    </button>
                                </div>
                                <div className="p-6 space-y-4 overflow-y-auto flex-1">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Subject</label>
                                        <input
                                            type="text"
                                            value={emailSubject}
                                            onChange={(e) => setEmailSubject(e.target.value)}
                                            placeholder="e.g., Weekly Highlights & Offers"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Message</label>
                                        <textarea
                                            value={emailBody}
                                            onChange={(e) => setEmailBody(e.target.value)}
                                            placeholder="Write your message here..."
                                            rows="6"
                                            className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none resize-none"
                                        ></textarea>
                                    </div>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 text-sm p-4 rounded-lg">
                                        <p><strong>Privacy Protected:</strong> We use the <strong>BCC</strong> (Blind Carbon Copy) method.</p>
                                        <p className="mt-1">When you click Send, the email will use your default email address as the sender. All member emails are hidden in the <strong>BCC</strong> field, so they cannot see each other.</p>
                                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Don't forget to drag and drop your images!</p>
                                    </div>
                                </div>
                                <div className="p-6 bg-gray-50 dark:bg-gray-900/50 flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsEmailModalOpen(false)}
                                        className="px-4 py-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 font-medium transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleSendEmail}
                                        className="px-6 py-2 rounded-lg bg-primary-600 text-white font-bold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-500/30"
                                    >
                                        Send Broadcast
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </motion.div>
    );
};

const AdminDashboard = () => {
    const { adminLogout, registeredUsers, user, deleteUser, adminUser } = useAuth();
    const role = adminUser?.role || 'owner';

    const navigate = useNavigate();
    // Retrieve URL params for tab state
    const searchParams = new URL(window.location.href).searchParams;

    // Determine default/initial tab based on role
    let initialTab = searchParams.get('tab');
    if (!initialTab) {
        initialTab = (role === 'seller' || role === 'courier') ? 'orders' : 'dashboard';
    } else if ((role === 'seller' || role === 'courier') && (initialTab === 'dashboard' || initialTab === 'customers' || initialTab === 'sellers' || initialTab === 'club' || initialTab === 'categories' || initialTab === 'couriers')) {
        // Redirect sellers/couriers attempting to access restricted tabs
        initialTab = 'orders';
    }

    const [activeTab, setActiveTab] = useState(initialTab);

    // Sync tab changes to URL
    useEffect(() => {
        const url = new URL(window.location.href);
        url.searchParams.set('tab', activeTab);
        window.history.pushState({}, '', url);
    }, [activeTab]);

    const { products, addProduct, updateProduct, deleteProduct } = useProducts();
    const { orders, loading, updateOrderStatus, markLabelPrinted, getStats, deleteOrder } = useOrders();
    const { showNotification } = useNotification();

    const navItems = role === 'seller' ? [
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'products', label: 'Products', icon: Package },
    ] : role === 'courier' ? [
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
    ] : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'orders', label: 'Orders', icon: ShoppingCart },
        { id: 'products', label: 'Products', icon: Package },
        { id: 'categories', label: 'Categories', icon: Filter },
        { id: 'customers', label: 'Customers', icon: Users },
        { id: 'sellers', label: 'Seller', icon: Users },
        { id: 'couriers', label: 'Couriers', icon: Truck },
        { id: 'club', label: 'Club Members', icon: Crown },
    ];
    const { formatPrice, currency, toggleCurrency } = useCurrency();
    const { isDark, toggleTheme } = useTheme();
    const [isCurrencyOpen, setIsCurrencyOpen] = useState(false);


    // Product Management State
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [modifiedProducts, setModifiedProducts] = useState({});

    // Details Modal State
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedCustomer, setSelectedCustomer] = useState(null);

    // Delete Product Modal State (Lifted Up)
    const [isDeleteProductModalOpen, setIsDeleteProductModalOpen] = useState(false);
    const [productToDelete, setProductToDelete] = useState(null);
    const [deleteProductPassword, setDeleteProductPassword] = useState('');

    const openDeleteProductModal = (product) => {
        setProductToDelete(product);
        setDeleteProductPassword('');
        setIsDeleteProductModalOpen(true);
    };

    const confirmProductDelete = () => {
        if (deleteProductPassword === 'admin123') {
            if (productToDelete) {
                handleDelete(productToDelete.id);
            }
            setIsDeleteProductModalOpen(false);
            setProductToDelete(null);
        } else {
            showNotification('Incorrect password! Deletion cancelled.', 'error');
        }
    };

    // --- Product Handlers ---
    const handleLogout = () => {
        adminLogout();
        navigate('/');
        showNotification('Logged out successfully', 'success');
    };

    const handleDeleteOrder = (id) => {
        // Parent wrapper - no confirm here, trusted source
        deleteOrder(id);
        showNotification('Order deleted successfully', 'success');
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setIsFormOpen(true);
    };

    const handleDelete = (id) => {
        // Parent wrapper - no confirm here, trusted source
        deleteProduct(id);
        showNotification('Product deleted successfully!', 'success');
    };

    const handleFormSubmit = (productData) => {
        if (editingProduct) {
            updateProduct(editingProduct.id, productData);
            showNotification('Product updated successfully!', 'success');
        } else {
            addProduct(productData);
            showNotification('Product added successfully!', 'success');
        }
        setIsFormOpen(false);
        setEditingProduct(null);
    };

    const toggleFeatured = (productId) => {
        const product = products.find(p => p.id === productId);
        const currentValue = modifiedProducts[productId]?.isFeatured ?? product.isFeatured;
        const newValue = !currentValue;

        setModifiedProducts(prev => {
            const currentMod = { ...(prev[productId] || {}) };

            if (newValue === product.isFeatured) {
                delete currentMod.isFeatured;
            } else {
                currentMod.isFeatured = newValue;
            }

            if (Object.keys(currentMod).length === 0) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: currentMod };
        });
    };

    const toggleSale = (productId) => {
        const product = products.find(p => p.id === productId);
        const currentValue = modifiedProducts[productId]?.isOnSale ?? product.isOnSale;
        const newValue = !currentValue;

        setModifiedProducts(prev => {
            const currentMod = { ...(prev[productId] || {}) };

            if (newValue === product.isOnSale) {
                delete currentMod.isOnSale;
            } else {
                currentMod.isOnSale = newValue;
            }

            if (Object.keys(currentMod).length === 0) {
                const { [productId]: _, ...rest } = prev;
                return rest;
            }
            return { ...prev, [productId]: currentMod };
        });
    };

    const handleBatchUpdate = () => {
        let updateCount = 0;
        Object.keys(modifiedProducts).forEach(productId => {
            // Robust matching: Compare as strings to find the product, then use its original ID type
            const product = products.find(p => String(p.id) === productId);
            if (product) {
                updateProduct(product.id, { ...product, ...modifiedProducts[productId] });
                updateCount++;
            }
        });
        if (updateCount > 0) {
            showNotification(`${updateCount} product(s) updated successfully!`, 'success');
            setModifiedProducts({});
        } else {
            showNotification('No changes to update', 'info');
        }
    };

    // --- New Order & Delivery Alert Logic ---
    const playDeliverySound = () => {
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (!AudioContext) return;
            const audioCtx = new AudioContext();

            // Success Chime (Rising Arpeggio)
            // C5 -> E5 -> G5 (C Major Chord)
            const notes = [523.25, 659.25, 783.99];
            const startTimes = [0, 0.1, 0.2];

            notes.forEach((note, i) => {
                const osc = audioCtx.createOscillator();
                const gain = audioCtx.createGain();
                osc.connect(gain);
                gain.connect(audioCtx.destination);

                osc.type = 'sine';
                osc.frequency.setValueAtTime(note, audioCtx.currentTime + startTimes[i]);

                gain.gain.setValueAtTime(0, audioCtx.currentTime + startTimes[i]);
                gain.gain.linearRampToValueAtTime(0.3, audioCtx.currentTime + startTimes[i] + 0.05);
                gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + startTimes[i] + 0.4);

                osc.start(audioCtx.currentTime + startTimes[i]);
                osc.stop(audioCtx.currentTime + startTimes[i] + 0.4);
            });

        } catch (e) {
            console.error("Audio play failed", e);
        }
    };
    const [newOrderAlert, setNewOrderAlert] = useState(null);
    const [deliveryAlert, setDeliveryAlert] = useState(null);
    const prevOrderCountRef = useRef(null);

    const audioCtxRef = useRef(null);

    // Initialize AudioContext
    useEffect(() => {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) {
            audioCtxRef.current = new AudioContext();
        }

        // Unlock AudioContext on first user interaction
        const unlockAudio = () => {
            if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume().then(() => {
                    console.log("AudioContext resumed successfully");
                });
            }
            // Remove listener after first interaction
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };

        document.addEventListener('click', unlockAudio);
        document.addEventListener('keydown', unlockAudio);

        return () => {
            if (audioCtxRef.current) {
                audioCtxRef.current.close().catch(console.error);
            }
            document.removeEventListener('click', unlockAudio);
            document.removeEventListener('keydown', unlockAudio);
        };
    }, []);

    const playNotificationSound = () => {
        try {
            const audioCtx = audioCtxRef.current;
            if (!audioCtx) return;

            // If suspended, we rely on the global click listener to resume it.
            // Attempting to resume here without a user gesture causes browser warnings.
            if (audioCtx.state === 'suspended') {
                return;
            }

            // Creates a louder "Ding-Dong" or 2-tone effect
            // Tone 1
            const osc1 = audioCtx.createOscillator();
            const gain1 = audioCtx.createGain();
            osc1.connect(gain1);
            gain1.connect(audioCtx.destination);

            osc1.type = 'triangle'; // Clearer, louder tone than sine
            osc1.frequency.setValueAtTime(880, audioCtx.currentTime); // High A5
            gain1.gain.setValueAtTime(0.5, audioCtx.currentTime); // Much louder
            gain1.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);

            osc1.start(audioCtx.currentTime);
            osc1.stop(audioCtx.currentTime + 0.5);

            // Tone 2 (Harmonious delayed beep)
            const osc2 = audioCtx.createOscillator();
            const gain2 = audioCtx.createGain();
            osc2.connect(gain2);
            gain2.connect(audioCtx.destination);

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(587, audioCtx.currentTime + 0.2); // D5
            gain2.gain.setValueAtTime(0.5, audioCtx.currentTime + 0.2);
            gain2.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.8);

            osc2.start(audioCtx.currentTime + 0.2);
            osc2.stop(audioCtx.currentTime + 0.8);
        } catch (e) {
            console.error("Audio play failed", e);
        }
    };

    useEffect(() => {
        // Init ref if it's null (first run) or if we just finished loading
        if (loading) return;

        if (prevOrderCountRef.current === null) {
            prevOrderCountRef.current = orders.length;
            return;
        }

        if (orders.length > prevOrderCountRef.current) {
            // New order detected!
            // STRICT: Only show for Owner and Seller (No Couriers)
            if (role === 'owner' || role === 'seller') {
                const newOrder = orders[0]; // Assuming new orders are added to the start
                setNewOrderAlert(newOrder);
                playNotificationSound();
                showNotification(`New Order received: #${newOrder.id}`, 'success');
                setTimeout(() => setNewOrderAlert(null), 8000);
            }
        }
        prevOrderCountRef.current = orders.length;
    }, [orders, loading, role, showNotification]);

    // Track previous statuses to detect changes
    const prevStatusesRef = useRef({});

    useEffect(() => {
        // Initialize prev statuses on first run or skipped if orders is empty initially
        // This prevents alerting on initial load
        if (Object.keys(prevStatusesRef.current).length === 0 && orders.length > 0) {
            orders.forEach(o => {
                prevStatusesRef.current[o.id] = o.status;
            });
            return;
        }

        orders.forEach(order => {
            const prevStatus = prevStatusesRef.current[order.id];

            // Detect Status Change to 'Delivered'
            if (prevStatus && prevStatus !== 'Delivered' && order.status === 'Delivered') {
                // Show Alert for Owner/Seller
                if (role === 'owner' || role === 'seller') {
                    setDeliveryAlert({
                        orderId: order.id,
                        courierId: order.deliveredBy || 'Courier',
                        customerName: order.customer?.name
                    });
                    playDeliverySound();
                    setTimeout(() => setDeliveryAlert(null), 8000);
                }
            }

            // Update ref
            prevStatusesRef.current[order.id] = order.status;
        });
    }, [orders, role]);

    const handleAlertClick = () => {
        if (newOrderAlert) {
            setActiveTab('orders');
            setSelectedOrder(newOrderAlert);
            setNewOrderAlert(null);
        }
        if (deliveryAlert) {
            setActiveTab('orders');
            setSearchTerm(String(deliveryAlert.orderId)); // Auto-search for it
            setDeliveryAlert(null);
        }
    };

    const hasChanges = Object.keys(modifiedProducts).length > 0;

    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    return (
        <div className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#0f172a] dark:bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] dark:from-indigo-900 dark:via-slate-950 dark:to-black items-stretch relative">
            {/* New Order Broadcast Popup */}
            {createPortal(
                <AnimatePresence>
                    {newOrderAlert && (
                        <motion.div
                            key="new-order-alert"
                            initial={{ opacity: 0, y: -100, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: -100, x: '-50%' }}
                            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] cursor-pointer"
                            onClick={handleAlertClick}
                        >
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-l-4 border-green-500 p-4 flex items-center gap-4 min-w-[300px] md:min-w-[400px]">
                                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
                                    <Megaphone className="animate-bounce" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">New Order Received!</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        {newOrderAlert.customer?.name || 'Guest'} just placed an order.
                                    </p>
                                    <p className="text-sm font-bold text-green-600 mt-1">
                                        {formatPrice(newOrderAlert.total)}
                                    </p>
                                </div>
                                <div className="text-xs text-gray-400 truncate max-w-[60px]">
                                    #{newOrderAlert.id}
                                </div>
                            </div>
                        </motion.div>
                    )}
                    {deliveryAlert && (
                        <motion.div
                            key="delivery-alert"
                            initial={{ opacity: 0, y: -100, x: '-50%' }}
                            animate={{ opacity: 1, y: 0, x: '-50%' }}
                            exit={{ opacity: 0, y: -100, x: '-50%' }}
                            className="fixed top-24 left-1/2 transform -translate-x-1/2 z-[9999] cursor-pointer"
                            onClick={handleAlertClick}
                        >
                            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border-l-4 border-green-500 p-4 flex items-center gap-4 min-w-[300px] md:min-w-[400px]">
                                <div className="bg-green-100 dark:bg-green-900/30 p-3 rounded-full text-green-600 dark:text-green-400">
                                    <Truck className="animate-bounce" size={24} />
                                </div>
                                <div className="flex-1">
                                    <h4 className="font-bold text-gray-900 dark:text-white text-sm uppercase tracking-wide">Order Delivered!</h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                        Order <strong>#{deliveryAlert.orderId}</strong> has been successfully delivered.
                                    </p>
                                    <p className="text-xs font-bold text-green-600 mt-1">
                                        Courier: {deliveryAlert.courierId}
                                    </p>
                                </div>
                                <div className="text-xs text-gray-400">
                                    Just Now
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Mobile Header */}
            <div className="md:hidden absolute top-4 left-4 z-40">
                <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="p-2 bg-gray-800 rounded-lg shadow-md text-gray-200"
                >
                    <Menu size={24} />
                </button>
            </div>

            {/* Mobile Sidebar Backdrop */}
            {isMobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <div className={`
                fixed md:static top-16 bottom-0 left-0 z-50 w-64 bg-[#1e293b] dark:bg-white/10 dark:backdrop-blur-3xl shadow-2xl flex flex-col border-r border-gray-800 dark:border-white/10
                transform transition-transform duration-300 ease-in-out
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            `}>
                <div className="p-6">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xs uppercase font-bold text-gray-400 dark:text-gray-400 tracking-wider">Main Menu</h2>
                        <button
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="md:hidden text-gray-400 hover:text-white"
                        >
                            <X size={20} />
                        </button>
                    </div>
                    <nav className="space-y-2">
                        {navItems.map((item) => (
                            <button
                                type="button"
                                key={item.id}
                                onClick={() => {
                                    setActiveTab(item.id);
                                    setIsMobileMenuOpen(false);
                                }}
                                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors duration-200 ${activeTab === item.id
                                    ? 'bg-blue-600 text-white font-bold shadow-md'
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                                    }`}
                            >
                                <item.icon size={20} />
                                <span>{item.label}</span>
                            </button>
                        ))}
                    </nav>
                </div>
                <div className="mt-auto p-6 flex flex-col items-center">
                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full flex items-center justify-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors cursor-pointer"
                    >
                        <LogOut size={20} />
                        <span>Logout</span>
                    </button>
                    <div className="text-xs text-center text-white/40 mt-4 cursor-default tracking-wide font-medium">
                        DB Version 1.0
                        <div className="text-[10px] text-white/30 mt-1 font-normal">
                            Design & Develop by 51088
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto w-full" style={{ scrollbarGutter: 'stable' }}>
                <div className="p-8 pt-16 md:pt-8 max-w-7xl mx-auto min-h-[calc(100vh-120px)]">
                    {/* Content Views with Transition */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'dashboard' &&
                                <Overview
                                    stats={getStats()}
                                    registeredUsers={registeredUsers}
                                    orders={orders}
                                    formatPrice={formatPrice}
                                />
                            }
                            {activeTab === 'orders' &&
                                <OrdersView
                                    role={role}
                                    currentUser={adminUser}
                                    orders={orders}
                                    registeredUsers={registeredUsers}
                                    updateOrderStatus={updateOrderStatus}
                                    setSelectedOrder={setSelectedOrder}
                                    handleDeleteOrder={handleDeleteOrder}
                                    formatPrice={formatPrice}
                                    showNotification={showNotification}
                                    markLabelPrinted={markLabelPrinted}
                                />
                            }
                            {activeTab === 'products' && (
                                <ProductsView
                                    role={role}
                                    products={products}
                                    onAddProduct={() => setIsFormOpen(true)}
                                    onEditProduct={(product) => {
                                        setEditingProduct(product);
                                        setIsFormOpen(true);
                                    }}
                                    onDeleteClick={openDeleteProductModal}
                                    modifiedProducts={modifiedProducts}
                                    toggleFeatured={toggleFeatured}
                                    toggleSale={toggleSale}
                                    formatPrice={formatPrice}
                                    handleBatchUpdate={handleBatchUpdate}
                                    hasChanges={hasChanges}
                                    setEditingProduct={setEditingProduct}
                                    setIsFormOpen={setIsFormOpen}
                                    showNotification={showNotification}
                                    updateProduct={updateProduct}
                                    setModifiedProducts={setModifiedProducts}
                                />
                            )}
                            {activeTab === 'categories' && <CategoriesView showNotification={showNotification} />}
                            {activeTab === 'customers' && (
                                <CustomersView
                                    registeredUsers={registeredUsers}
                                    orders={orders}
                                    setSelectedCustomer={setSelectedCustomer}
                                    currentUser={user}
                                    showNotification={showNotification}
                                    formatPrice={formatPrice}
                                    deleteUser={deleteUser}
                                    deleteOrder={deleteOrder}
                                />
                            )}
                            {activeTab === 'sellers' && <SellersView showNotification={showNotification} orders={orders} formatPrice={formatPrice} />}
                            {activeTab === 'couriers' && <CouriersView showNotification={showNotification} orders={orders} formatPrice={formatPrice} />}
                            {activeTab === 'club' && <ClubMembersView showNotification={showNotification} />}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {createPortal(
                isFormOpen && (
                    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
                        <ProductForm
                            product={editingProduct}
                            onSubmit={handleFormSubmit}
                            onCancel={() => { setIsFormOpen(false); setEditingProduct(null); }}
                        />
                    </div>
                ),
                document.body
            )}

            {/* Order Details Modal */}
            {createPortal(
                selectedOrder && (
                    <OrderDetailsModal
                        order={orders.find(o => o.id === selectedOrder.id) || selectedOrder}
                        onClose={() => setSelectedOrder(null)}
                    />
                ),
                document.body
            )}

            {/* Customer Details Modal */}
            {createPortal(
                selectedCustomer && (
                    <CustomerDetailsModal
                        customer={selectedCustomer}
                        customerOrders={orders.filter(o => o.customer?.email === selectedCustomer.email)}
                        onClose={() => setSelectedCustomer(null)}
                    />
                ),
                document.body
            )}

            {/* Global Delete Product Modal */}
            {createPortal(
                <AnimatePresence>
                    {isDeleteProductModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                            onClick={() => setIsDeleteProductModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-gray-700 mx-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-2 text-red-600 flex items-center gap-2">
                                    <Trash2 size={20} />
                                    Delete Product
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Are you sure you want to delete <strong>{productToDelete?.name}</strong>?
                                </p>

                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 text-sm dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Enter password"
                                    value={deleteProductPassword}
                                    onChange={e => setDeleteProductPassword(e.target.value)}
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsDeleteProductModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmProductDelete}
                                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!deleteProductPassword}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div >
    );
};

export default AdminDashboard;
