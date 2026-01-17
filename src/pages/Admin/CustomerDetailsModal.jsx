import { X, User, Phone, Mail, MapPin, ShoppingBag, Calendar, Download } from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import logo from '../../assets/logo1.png';
import { useCurrency } from '../../components/CurrencyContext';
import { motion } from 'framer-motion';

const CustomerDetailsModal = ({ customer, customerOrders, onClose }) => {
    const { formatPrice } = useCurrency();
    if (!customer) return null;

    const totalSpent = customerOrders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
    const lastOrderDate = customerOrders.length > 0
        ? new Date(Math.max(...customerOrders.map(o => new Date(o.date)))).toLocaleString()
        : 'Never';

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-start pt-20 justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 dark:border-transparent"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="bg-primary-100 dark:bg-primary-900/30 rounded-full text-primary-600 dark:text-primary-400 h-12 w-12 flex items-center justify-center overflow-hidden">
                            {customer.profile_picture ? (
                                <img src={customer.profile_picture} alt={customer.name} className="w-full h-full object-cover" />
                            ) : (
                                <User size={24} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                {customer.name || 'Unknown User'}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {customer.isGuest ? 'Guest Customer' : 'Registered Member'}
                            </p>
                            {!customer.isGuest && customer.joinedDate && (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                    Joined: {new Date(customer.joinedDate).toLocaleDateString()} at {new Date(customer.joinedDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                try {
                                    const doc = new jsPDF();

                                    // --- Header ---
                                    // Logo
                                    doc.addImage(logo, 'PNG', 14, 10, 58, 20);

                                    // Document Title
                                    doc.setFontSize(18);
                                    doc.setTextColor(0);
                                    doc.text("Customer Profile", 196, 20, { align: 'right' });

                                    // Date
                                    doc.setFontSize(10);
                                    doc.setTextColor(100);
                                    doc.text(`Generated: ${new Date().toLocaleString()}`, 196, 26, { align: 'right' });

                                    // Separator Line
                                    doc.setDrawColor(230);
                                    doc.line(14, 32, 196, 32);

                                    // Stats Section
                                    doc.setTextColor(0, 0, 0);
                                    doc.setFontSize(12);
                                    doc.setFont("helvetica", "bold");
                                    doc.text("Customer Details:", 14, 42);

                                    doc.setFont("helvetica", "normal");
                                    doc.text(`Name:   ${customer.name || 'Unknown'}`, 14, 50);
                                    doc.text(`Email:  ${customer.email}`, 14, 56);
                                    doc.text(`Phone:  ${customer.phone || 'N/A'}`, 14, 62);
                                    doc.text(`Type:   ${customer.isGuest ? 'Guest' : 'Member'}`, 14, 68);

                                    doc.setFontSize(14);
                                    doc.setFont("helvetica", "bold");
                                    doc.text('Summary', 14, 80);
                                    doc.setFontSize(10);
                                    doc.text(`Total Orders: ${customerOrders.length}`, 14, 88);
                                    doc.text(`Total Spent: ${formatPrice(totalSpent)}`, 14, 94);
                                    doc.text(`Last Active: ${lastOrderDate}`, 14, 100);

                                    // Orders Table
                                    // Orders Table
                                    autoTable(doc, {
                                        startY: 110,
                                        head: [['Order ID', 'Date & Time', 'Items', 'Status', 'Total']],
                                        body: customerOrders.map(order => {
                                            const itemsStr = order.items ? order.items.map(i => `• ${i.name} ${i.code ? `[${i.code}] ` : ''}(${i.size}${i.color ? `, ${i.color}` : ''}) x${i.quantity}`).join('\n') : 'No items';
                                            return [
                                                `#${order.id}`,
                                                new Date(order.date).toLocaleString(),
                                                itemsStr,
                                                order.status,
                                                formatPrice(order.total)
                                            ];
                                        }),
                                        theme: 'grid',
                                        headStyles: { fillColor: [249, 115, 22] },
                                        styles: { fontSize: 8, cellPadding: 2, valign: 'middle' },
                                        columnStyles: {
                                            2: { cellWidth: 80 } // Wide column for items
                                        },
                                        margin: { top: 20, bottom: 30 },
                                        didParseCell: function (data) {
                                            if (data.section === 'body' && data.column.index === 3) {
                                                const status = data.cell.raw;
                                                if (status === 'Delivered') {
                                                    data.cell.styles.textColor = [22, 163, 74];
                                                } else if (status === 'Cancelled') {
                                                    data.cell.styles.textColor = [220, 38, 38];
                                                } else if (status === 'Shipped' || status === 'Processing') {
                                                    data.cell.styles.textColor = [37, 99, 235];
                                                } else if (status === 'Pending') {
                                                    data.cell.styles.textColor = [202, 138, 4];
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
                                    // Save
                                    const now = new Date();
                                    const dateStr = now.getFullYear() + "-" +
                                        String(now.getMonth() + 1).padStart(2, '0') + "-" +
                                        String(now.getDate()).padStart(2, '0') + "_" +
                                        String(now.getHours()).padStart(2, '0') + "-" +
                                        String(now.getMinutes()).padStart(2, '0') + "-" +
                                        String(now.getSeconds()).padStart(2, '0');
                                    doc.save(`Customer_Profile_${customer.name.replace(/\s+/g, '_')}_${dateStr}.pdf`);
                                } catch (error) {
                                    console.error("PDF generation failed:", error);
                                    alert("Failed to generate PDF. Please check console for details.");
                                }
                            }}
                            className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full transition-colors"
                            title="Download PDF Profile"
                        >
                            <Download size={24} />
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto flex-1">

                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4 mb-8">
                        <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl border border-blue-100 dark:border-blue-800/30">
                            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold uppercase tracking-wide">Total Orders</p>
                            <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{customerOrders.length}</p>
                        </div>
                        <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl border border-green-100 dark:border-green-800/30">
                            <p className="text-xs text-green-600 dark:text-green-400 font-bold uppercase tracking-wide">Total Spent</p>
                            <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatPrice(totalSpent)}</p>
                        </div>
                        <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl border border-purple-100 dark:border-purple-800/30">
                            <p className="text-xs text-purple-600 dark:text-purple-400 font-bold uppercase tracking-wide">Last Order</p>
                            <p className="text-lg font-bold text-purple-900 dark:text-purple-100">{lastOrderDate}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Contact Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2 border-gray-100 dark:border-gray-700">
                                Contact Information
                            </h3>
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <Mail size={16} className="text-gray-400" />
                                    {customer.email}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                                    <Phone size={16} className="text-gray-400" />
                                    {customer.phone || 'N/A'}
                                </div>
                            </div>
                        </div>

                        {/* Address Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider border-b pb-2 border-gray-100 dark:border-gray-700">
                                Shipping Address
                            </h3>
                            <div className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                <MapPin size={16} className="text-gray-400 mt-1" />
                                <div>
                                    <p>{customer.address || customerOrders[0]?.customer?.address || 'No address on file'}</p>
                                    <p>
                                        {customer.city || customerOrders[0]?.customer?.city}
                                        {customer.zip || customerOrders[0]?.customer?.zip ? `, ${customer.zip || customerOrders[0]?.customer?.zip}` : ''}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Order History */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShoppingBag size={16} /> Order History
                        </h3>

                        {customerOrders.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 border-2 border-dashed border-gray-100 rounded-lg">
                                No orders found for this customer.
                            </div>
                        ) : (
                            <div className="overflow-hidden border border-gray-100 dark:border-white/10 rounded-xl">
                                <table className="min-w-full divide-y divide-gray-100 dark:divide-white/10">
                                    <thead className="bg-gray-50 dark:bg-white/5">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Order ID</th>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Date & Time</th>
                                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-white/10 bg-white dark:bg-transparent">
                                        {customerOrders.map(order => (
                                            <tr key={order.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                                <td className="px-4 py-3 text-sm font-medium text-gray-900 dark:text-white">#{order.id}</td>
                                                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                                                    {new Date(order.date).toLocaleString()}
                                                </td>
                                                <td className="px-4 py-3 text-center">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${order.status === 'Delivered' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                        order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                            order.status === 'Hand on Courier' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                                order.status === 'Cancelled' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                                    'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                        }`}>
                                                        {order.status}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-right text-sm font-bold text-gray-900 dark:text-white">
                                                    {formatPrice(order.total)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CustomerDetailsModal;
