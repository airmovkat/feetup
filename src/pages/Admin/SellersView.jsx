
import { useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Users, User, Trash2, Check, X, Search, ClipboardList, Truck, Calendar, Clock, Package } from 'lucide-react';
import { useAuth } from '../../components/AuthContext';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download } from 'lucide-react';
import logo from '../../assets/logo1.png';

const SellersView = ({ showNotification, orders = [], formatPrice }) => {
    const { adminUsers, addAdminUser, deleteAdminUser, activeAdminIds, updateAdminUser } = useAuth();
    const [newSeller, setNewSeller] = useState({ name: '', phone: '', password: '', role: 'seller' });
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [editingId, setEditingId] = useState(null);

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [sellerToDelete, setSellerToDelete] = useState(null);
    const [deletePassword, setDeletePassword] = useState('');

    // History Modal State
    const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
    const [historySeller, setHistorySeller] = useState(null);

    const handleDownloadHistory = () => {
        if (!historySeller) return;

        try {
            const doc = new jsPDF();
            const sellerOrders = orders
                .filter(o => o.forwardedBy === historySeller.name)
                .sort((a, b) => new Date(b.handOnCourierAt || b.date) - new Date(a.handOnCourierAt || a.date));

            // --- Header (Standard Design) ---
            // Logo Graphic (Shoe Prints)
            // --- Header ---
            // Logo
            doc.addImage(logo, 'PNG', 14, 10, 58, 20);

            // Document Title
            doc.setFontSize(18);
            doc.setTextColor(0);
            doc.text("Handover History", 196, 20, { align: 'right' });

            // Date
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 26, { align: 'right' });

            // Separator Line
            doc.setDrawColor(230);
            doc.line(14, 32, 196, 32);

            // --- Seller Details ---
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text("Seller Details:", 14, 42);

            doc.setFont("helvetica", "normal");
            doc.text(`Name:   ${historySeller.name}`, 14, 50);
            doc.text(`ID:     ${historySeller.id}`, 14, 56);
            doc.text(`Phone:  ${historySeller.phone}`, 14, 62);
            doc.text(`Role:   Authorized Seller`, 14, 68);

            // --- Summary Section ---
            doc.setFontSize(14);
            doc.setFont("helvetica", "bold");
            doc.text('Summary', 14, 80);
            doc.setFontSize(10);
            doc.text(`Total Orders Handed Over: ${sellerOrders.length}`, 14, 88);

            const totalValue = sellerOrders.reduce((sum, order) => sum + (order.total || 0), 0);
            doc.text(`Total Value: ${formatPrice ? formatPrice(totalValue) : totalValue}`, 14, 94);

            // --- Table ---
            const tableRows = sellerOrders.map(order => [
                `#${order.id}`,
                new Date(order.handOnCourierAt || order.date).toLocaleString(),
                formatPrice ? formatPrice(order.total) : order.total,
                order.deliveredBy || 'Pending'
            ]);

            autoTable(doc, {
                startY: 110,
                head: [['Order ID', 'Handover Date', 'Total', 'Courier / Status']],
                body: tableRows,
                theme: 'grid',
                headStyles: { fillColor: [249, 115, 22] }, // Orange header
                styles: { fontSize: 9, cellPadding: 3, valign: 'middle' },
                didParseCell: function (data) {
                    if (data.section === 'body' && data.column.index === 3) {
                        const cellText = data.cell.raw;
                        if (cellText === 'Pending') {
                            data.cell.styles.textColor = [202, 138, 4];
                        } else {
                            data.cell.styles.textColor = [37, 99, 235]; // Blue for Courier Name
                        }
                    }
                }
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
            doc.save(`Seller_History_${historySeller.name.replace(/\s+/g, '_')}_${dateStr}.pdf`);
            showNotification('History report downloaded!', 'success');
        } catch (error) {
            console.error("PDF Export Error:", error);
            showNotification('Failed to export PDF', 'error');
        }
    };

    const handleAddSeller = (e) => {
        e.preventDefault();
        if (newSeller.name && newSeller.phone && newSeller.password) {
            if (isEditing) {
                // Update existing seller
                if (adminUsers.some(u => u.name === newSeller.name && u.id !== editingId)) {
                    showNotification('Username already exists for another seller', 'error');
                    return;
                }
                updateAdminUser({ ...newSeller, id: editingId });
                showNotification('Seller updated successfully', 'success');
            } else {
                // Add new seller
                if (adminUsers.some(u => u.name === newSeller.name)) {
                    showNotification('Username already exists', 'error');
                    return;
                }
                addAdminUser(newSeller);
                showNotification('New seller added successfully', 'success');
            }
            closeModal();
        }
    };

    const openModal = (seller = null) => {
        if (seller) {
            setNewSeller({ ...seller, password: seller.password });
            setIsEditing(true);
            setEditingId(seller.id);
        } else {
            // Calculate next ID for display
            const sellerIds = adminUsers
                .filter(u => u.role === 'seller' && u.id.startsWith('FS'))
                .map(u => parseInt(u.id.substring(2)));

            const maxId = sellerIds.length > 0 ? Math.max(...sellerIds) : 0;
            const nextId = `FS${String(maxId + 1).padStart(3, '0')}`;

            setNewSeller({ id: nextId, name: '', phone: '', password: '', role: 'seller' });
            setIsEditing(false);
            setEditingId(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewSeller({ name: '', phone: '', password: '', role: 'seller' });
        setIsEditing(false);
        setEditingId(null);
    };

    const handleDeleteClick = (seller) => {
        setSellerToDelete(seller);
        setDeletePassword('');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (deletePassword === 'admin123') {
            if (sellerToDelete) {
                deleteAdminUser(sellerToDelete.id);
                showNotification('Seller removed successfully', 'success');
            }
            setIsDeleteModalOpen(false);
            setSellerToDelete(null);
        } else {
            showNotification('Incorrect password! Deletion cancelled.', 'error');
        }
    };

    const sellers = adminUsers ? adminUsers.filter(u => u.role === 'seller').filter(s =>
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phone.includes(searchTerm)
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
                    <h2 className="text-xl font-bold dark:text-white">Seller Management</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your authorized sellers and their permissions.</p>
                </div>
                <div className="flex gap-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            autoComplete="off"
                            placeholder="Search sellers..."
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
                        Add New Seller
                    </button>
                </div>
            </div>

            {/* Sellers Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sellers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400 bg-white/5 rounded-2xl border border-dashed border-white/10">
                        <Users size={48} className="mx-auto mb-4 opacity-50" />
                        <p>No sellers found. Add one to get started.</p>
                    </div>
                ) : (
                    sellers.map((seller, idx) => {
                        const isActive = activeAdminIds && activeAdminIds.includes(seller.id);
                        return (
                            <div
                                key={seller.id || idx}
                                onClick={() => openModal(seller)}
                                className={`border border-gray-100 dark:border-white/20 px-4 pb-4 pt-9 rounded-2xl flex items-start space-x-4 bg-gray-50 dark:bg-white/10 dark:backdrop-blur-md hover:shadow-lg transition-all relative cursor-pointer group hover:border-primary-200 dark:hover:border-primary-500/50`}
                            >
                                <div
                                    onClick={(e) => e.stopPropagation()}
                                    className="absolute -top-px -right-px bg-orange-100 text-orange-600 text-[10px] px-2 py-1 rounded-bl-lg rounded-tr-2xl font-bold cursor-default"
                                >
                                    SELLER
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

                                {seller.profile_picture ? (
                                    <div className="h-14 w-14 rounded-full shadow-sm overflow-hidden shrink-0 mt-2">
                                        <img src={seller.profile_picture} alt={seller.name} className="w-full h-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="bg-white dark:bg-gray-800 p-3 rounded-full shadow-sm h-14 w-14 flex items-center justify-center shrink-0 mt-2 text-gray-400">
                                        <User size={24} />
                                    </div>
                                )}

                                <div className="flex-1 min-w-0 pt-2">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-gray-700 dark:text-gray-300 text-base font-bold uppercase tracking-wide">
                                            ID {seller.id}
                                        </span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-0.5 truncate leading-tight">{seller.name}</h3>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 font-bold truncate">{seller.phone}</p>
                                </div>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleDeleteClick(seller);
                                    }}
                                    className="absolute bottom-3 right-3 p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors z-20"
                                    title="Delete Seller"
                                >
                                    <Trash2 size={18} />
                                </button>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setHistorySeller(seller);
                                        setIsHistoryModalOpen(true);
                                    }}
                                    className="absolute bottom-3 right-14 p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-full transition-colors z-20"
                                    title="View Handover History"
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
                                        {isEditing ? 'Edit Seller' : 'Add New Seller'}
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
                                    <form id="seller-form" onSubmit={handleAddSeller} className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seller ID</label>
                                            <input
                                                type="text"
                                                readOnly
                                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-zinc-800/50 dark:text-gray-400 bg-gray-100 shadow-sm p-2 border cursor-not-allowed font-mono text-sm"
                                                value={newSeller.id || 'Generating...'}
                                                disabled
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Seller Name</label>
                                            <input
                                                type="text"
                                                required
                                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                                value={newSeller.name}
                                                onChange={e => setNewSeller({ ...newSeller, name: e.target.value })}
                                                placeholder="Enter seller name"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone Number</label>
                                            <input
                                                type="tel"
                                                required
                                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                                value={newSeller.phone}
                                                onChange={e => setNewSeller({ ...newSeller, phone: e.target.value })}
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
                                                value={newSeller.password}
                                                onChange={e => setNewSeller({ ...newSeller, password: e.target.value })}
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
                                        form="seller-form"
                                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm"
                                    >
                                        {isEditing ? 'Update Seller' : 'Add Seller'}
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
                                    Remove Seller
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Are you sure you want to remove <strong>{sellerToDelete?.name}</strong>? This action cannot be undone.
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
                                        Delete Seller
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
                    {isHistoryModalOpen && historySeller && (
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
                                            Handover History
                                        </h2>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Orders handed over by <span className="font-bold text-gray-900 dark:text-white">{historySeller.name}</span>
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
                                    {orders
                                        .filter(o => o.forwardedBy === historySeller.name)
                                        .sort((a, b) => new Date(b.handOnCourierAt || b.date) - new Date(a.handOnCourierAt || a.date))
                                        .length === 0 ? (
                                        <div className="text-center py-12 text-gray-500 dark:text-gray-400 bg-white dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 mt-6 mx-6">
                                            <Package size={48} className="mx-auto mb-4 opacity-30" />
                                            <p>No handovers found for this seller.</p>
                                        </div>
                                    ) : (
                                        <table className="min-w-full divide-y divide-gray-200 dark:divide-white/10">
                                            <thead className="bg-gray-50 dark:bg-white/5 sticky top-0 z-10">
                                                <tr>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Order ID</th>
                                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date & Time</th>
                                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Courier</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white dark:bg-transparent divide-y divide-gray-200 dark:divide-white/10">
                                                {orders
                                                    .filter(o => o.forwardedBy === historySeller.name)
                                                    .sort((a, b) => new Date(b.handOnCourierAt || b.date) - new Date(a.handOnCourierAt || a.date))
                                                    .map(order => (
                                                        <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group cursor-default">
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                                {new Date(order.handOnCourierAt || order.date).toLocaleString()}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 dark:text-white text-center">
                                                                {formatPrice ? formatPrice(order.total) : order.total}
                                                            </td>
                                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white text-right">
                                                                <div className="inline-flex items-center gap-2">
                                                                    <Truck size={14} className="text-primary-500" />
                                                                    <span>{order.deliveredBy || 'Pending'}</span>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    ))}
                                            </tbody>
                                        </table>
                                    )}
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

export default SellersView;
