
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, User, Trash2, Check, X, Truck, ClipboardList, Search } from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/logo1.png';
import { Download } from 'lucide-react';

const CouriersView = ({ showNotification, orders = [], formatPrice }) => {
    const { adminUsers, addAdminUser, deleteAdminUser, activeAdminIds, updateAdminUser } = useAuth();
    const [newCourier, setNewCourier] = useState({ name: '', phone: '', password: '', role: 'courier' });
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [courierToDelete, setCourierToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historyCourier, setHistoryCourier] = useState(null);

    const handleDownloadHistory = () => {
        if (!historyCourier) return;

        try {
            const doc = new jsPDF();
            const courierOrders = orders
                .filter(o => o.status === 'Delivered' && o.deliveredBy === historyCourier.name)
                .sort((a, b) => a.id.localeCompare(b.id));

            // --- Header ---
            // Logo
            doc.addImage(logo, 'PNG', 14, 10, 58, 20);

            // Document Title
            doc.setFontSize(18);
            doc.setTextColor(0);
            doc.text("Delivery History", 196, 20, { align: 'right' });

            // Date
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 26, { align: 'right' });

            // Separator Line
            doc.setDrawColor(230);
            doc.line(14, 32, 196, 32);

            // --- Courier Details ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Courier Details:", 14, 42);

            doc.setFont("helvetica", "normal");
            doc.text(`Name:   ${historyCourier.name}`, 14, 50);
            doc.text(`ID:     ${historyCourier.id}`, 14, 56);
            doc.text(`Phone:  ${historyCourier.phone}`, 14, 62);
            doc.text(`Role:   Authorized Courier`, 14, 68);

            // --- Summary Section ---
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text('Summary', 14, 80);
            doc.setFontSize(10);
            doc.text(`Total Deliveries: ${courierOrders.length}`, 14, 88);

            // Calculate total value delivered
            const totalDeliveredValue = courierOrders.reduce((sum, order) => sum + (order.total || 0), 0);
            doc.text(`Total Value Delivered: ${formatPrice ? formatPrice(totalDeliveredValue) : totalDeliveredValue}`, 14, 94);

            // --- Table ---
            const tableRows = courierOrders.map(order => [
                `#${order.id}`,
                new Date(order.deliveredAt || order.date).toLocaleString(),
                order.customer?.name || 'Guest',
                formatPrice ? formatPrice(order.total) : order.total
            ]);

            autoTable(doc, {
                startY: 110,
                head: [['Order ID', 'Delivery Date', 'Customer', 'Total']],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [249, 115, 22] }, // Orange header to match others
                styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
            });

            // --- Footer (Standard Design) ---
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

            // Save
            const now = new Date();
            const dateStr = now.getFullYear() + "-" +
                String(now.getMonth() + 1).padStart(2, '0') + "-" +
                String(now.getDate()).padStart(2, '0') + "_" +
                String(now.getHours()).padStart(2, '0') + "-" +
                String(now.getMinutes()).padStart(2, '0') + "-" +
                String(now.getSeconds()).padStart(2, '0');
            doc.save(`Courier_History_${historyCourier.name.replace(/\s+/g, '_')}_${dateStr}.pdf`);
            showNotification('Delivery history report downloaded!', 'success');
        } catch (error) {
            console.error("PDF Export Error:", error);
            showNotification('Failed to export PDF', 'error');
        }
    };

    const handleAddCourier = (e) => {
        e.preventDefault();
        if (newCourier.name && newCourier.phone && newCourier.password) {
            if (isEditing) {
                // Update existing courier
                if (adminUsers.some(u => u.name === newCourier.name && u.id !== editingId)) {
                    showNotification('Username already exists for another courier', 'error');
                    return;
                }
                updateAdminUser({ ...newCourier, id: editingId });
                showNotification('Courier updated successfully', 'success');
            } else {
                // Add new courier
                if (adminUsers.some(u => u.name === newCourier.name)) {
                    showNotification('Username already exists', 'error');
                    return;
                }
                addAdminUser(newCourier);
                showNotification('New courier added successfully', 'success');
            }
            closeModal();
        }
    };

    const openModal = (courier = null) => {
        if (courier) {
            setNewCourier({ ...courier, password: courier.password });
            setIsEditing(true);
            setEditingId(courier.id);
        } else {
            // Calculate next ID for display
            const courierIds = adminUsers
                .filter(u => u.role === 'courier' && u.id.startsWith('FC'))
                .map(u => parseInt(u.id.substring(2)));

            const maxId = courierIds.length > 0 ? Math.max(...courierIds) : 0;
            const nextId = `FC${String(maxId + 1).padStart(3, '0')}`;

            setNewCourier({ id: nextId, name: '', phone: '', password: '', role: 'courier' });
            setIsEditing(false);
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewCourier({ name: '', phone: '', password: '', role: 'courier' });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleDeleteClick = (courier) => {
        setCourierToDelete(courier);
        setDeletePassword('');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (deletePassword === 'admin123') {
            if (courierToDelete) {
                deleteAdminUser(courierToDelete.id);
                showNotification('Courier removed successfully', 'success');
            }
            setIsDeleteModalOpen(false);
            setCourierToDelete(null);
        } else {
            showNotification('Incorrect password! Deletion cancelled.', 'error');
        }
    };

    const couriers = adminUsers ? adminUsers.filter(u => u.role === 'courier').filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    ) : [];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 shadow-xl rounded-2xl p-6 relative border border-gray-100 dark:border-transparent"
        >
            {/* Header & Add Button */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-xl font-bold dark:text-white">Courier Management</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your delivery partners.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            autoComplete="off"
                            placeholder="Search couriers..."
                            className="pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg text-sm bg-gray-50 dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none w-full md:w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <button
                        onClick={() => openModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus size={20} />
                        Add New Courier
                    </button>
                </div>
            </div>

            {/* Couriers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {couriers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <Truck size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No couriers found. Add one to get started.</p>
                    </div>
                ) : (
                    couriers.map((courier, idx) => {
                        const isActive = activeAdminIds && activeAdminIds.includes(courier.id);
                        return (
                            <div
                                key={courier.id || idx}
                                onClick={() => openModal(courier)}
                                className={`border border-gray-100 dark:border-white/20 px-4 pb-4 pt-9 rounded-2xl flex items-start space-x-4 bg-gray-50 dark:bg-white/10 dark:backdrop-blur-md hover:shadow-lg transition-all relative cursor-pointer group hover:border-primary-200 dark:hover:border-primary-500/50`}
                            >
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute -top-px -right-px bg-blue-100 text-blue-600 text-[10px] px-2 py-1 rounded-bl-lg rounded-tr-2xl font-bold cursor-default"
                                >
                                    COURIER
                                </div>

                                {isActive && (
                                    <div
                                        onClick={(e) => e.stopPropagation()}
                                        className="absolute -top-px -left-[16px] flex items-center gap-1 bg-green-100 text-green-600 text-[10px] px-2 py-1 rounded-br-lg rounded-tl-2xl font-bold z-10 cursor-default"
                                    >
                                        <span className="relative flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                        </span>
                                        ACTIVE
                                    </div>
                                )}

                                {courier.profile_picture ? (
                                    <div className="h-14 w-14 rounded-full shadow-sm overflow-hidden shrink-0 mt-2">
                                        <img src={courier.profile_picture} alt={courier.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm h-14 w-14 flex items-center justify-center shrink-0 mt-2 text-gray-400">
                                        <Truck size={24} />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0 pt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-700 dark:text-gray-300 text-base font-bold uppercase tracking-wide">
                                            ID {courier.id}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-0.5 truncate leading-tight">{courier.name}</h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-bold truncate">{courier.phone}</p>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(courier);
                                    }}
                                    className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors z-20"
                                    title="Delete Courier"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setHistoryCourier(courier);
                                        setIsHistoryModalOpen(true);
                                    }}
                                    className="absolute bottom-3 right-14 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors z-20"
                                    title="View Delivery History"
                                >
                                    <ClipboardList size={18} />
                                </button>
                            </div>
                        );
                    })
                )}
            </div>

            {/* Add/Edit Modal */}
            {createPortal(
                <AnimatePresence>
                    {isModalOpen && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-hidden backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl border border-gray-100 dark:border-transparent"
                            >
                                {/* Fixed Header */}
                                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10 shrink-0">
                                    <h2 className="text-xl font-bold dark:text-white">
                                        {isEditing ? 'Edit Courier' : 'Add New Courier'}
                                    </h2>
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                                    >
                                        <X size={24} />
                                    </button>
                                </div>

                                {/* Scrollable Content */}
                                <div className="p-6 overflow-y-auto flex-1">
                                    <form id="courier-form" onSubmit={handleAddCourier} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Courier ID</label>
                                            <input
                                                type="text"
                                                readOnly
                                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-zinc-800/50 dark:text-gray-400 bg-gray-100 shadow-sm p-2 border cursor-not-allowed font-mono text-sm"
                                                value={newCourier.id || 'Generating...'}
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Courier Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                                value={newCourier.name}
                                                onChange={e => setNewCourier({ ...newCourier, name: e.target.value })}
                                                placeholder="Enter courier name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                                value={newCourier.phone}
                                                onChange={e => setNewCourier({ ...newCourier, phone: e.target.value })}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Password</label>
                                            <input
                                                type="password"
                                                autoComplete="new-password"
                                                required
                                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                                value={newCourier.password}
                                                onChange={e => setNewCourier({ ...newCourier, password: e.target.value })}
                                                placeholder="Create password"
                                            />
                                        </div>
                                    </form>
                                </div>

                                {/* Fixed Footer */}
                                <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 shrink-0 flex justify-end space-x-3 rounded-b-2xl">
                                    <button
                                        type="button"
                                        onClick={closeModal}
                                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-white/10 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/20 shadow-sm transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        form="courier-form"
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm"
                                    >
                                        {isEditing ? 'Update Courier' : 'Add Courier'}
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Secure Delete Confirmation Modal */}
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
                                    Remove Courier
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Are you sure you want to remove <strong>{courierToDelete?.name}</strong>? This action cannot be undone.
                                </p>

                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 text-sm dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 outline-none"
                                    placeholder="Enter password to confirm"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                    autoFocus
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
                                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50"
                                        disabled={!deletePassword}
                                    >
                                        Delete Courier
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* History Modal */}
            {createPortal(
                <AnimatePresence>
                    {isHistoryModalOpen && historyCourier && (
                        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-hidden backdrop-blur-sm">
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl border border-gray-100 dark:border-transparent animate-in fade-in zoom-in duration-200 overflow-hidden"
                            >
                                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 shrink-0">
                                    <div>
                                        <h2 className="text-xl font-bold dark:text-white flex items-center gap-2">
                                            <ClipboardList size={24} className="text-blue-500" />
                                            Delivery History
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Orders delivered by <span className="font-bold text-gray-900 dark:text-white">{historyCourier.name}</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleDownloadHistory}
                                            className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                                            title="Download Report"
                                        >
                                            <Download size={24} />
                                        </button>
                                        <button onClick={() => setIsHistoryModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                                            <X size={24} />
                                        </button>
                                    </div>
                                </div>

                                <div className="p-0 overflow-y-auto flex-1">
                                    <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                                        <thead className="bg-gray-50 dark:bg-white/5 sticky top-0">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                                <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                                                <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-white/10">
                                            {orders
                                                .filter(o => o.status === 'Delivered' && o.deliveredBy === historyCourier.name)
                                                .sort((a, b) => a.id.localeCompare(b.id))
                                                .length === 0 ? (
                                                <tr>
                                                    <td colSpan="4" className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                                                        No delivered orders found for this courier.
                                                    </td>
                                                </tr>
                                            ) : (
                                                orders
                                                    .filter(o => o.status === 'Delivered' && o.deliveredBy === historyCourier.name)
                                                    .sort((a, b) => a.id.localeCompare(b.id))
                                                    .map(order => (
                                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                {new Date(order.deliveredAt || order.date).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{order.customer?.name}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white text-right">
                                                                {formatPrice ? formatPrice(order.total) : order.total}
                                                            </td>
                                                        </tr>
                                                    ))
                                            )}
                                        </tbody>
                                    </table>
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

export default CouriersView;
