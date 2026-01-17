import { X, User, MapPin, Phone, Mail, ShoppingBag } from 'lucide-react';
import { useCurrency } from '../../components/CurrencyContext';
import { useAuth } from '../../components/AuthContext';
import { motion } from 'framer-motion';

const OrderDetailsModal = ({ order, onClose }) => {
    const { formatPrice } = useCurrency();
    const { adminUsers } = useAuth();
    if (!order) return null;

    const deliveredByCourier = order.deliveredBy ? adminUsers.find(u => u.name === order.deliveredBy && u.role === 'courier') : null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-start pt-20 justify-center p-4 backdrop-blur-sm" onClick={onClose}>
            <motion.div
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh] border border-gray-100 dark:border-transparent"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10 shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            Order #{order.id}
                        </h2>
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                            {new Date(order.date).toLocaleString()}
                        </span>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto flex-1">
                    {/* Status Banner */}
                    <div className={`mb-8 p-4 rounded-xl flex justify-between items-center ${order.status === 'Pending' ? 'bg-yellow-50 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' :
                        order.status === 'Delivered' ? 'bg-green-50 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                            order.status === 'Cancelled' ? 'bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                                'bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                        }`}>
                        <span className="font-semibold">Order Status</span>
                        <div className="text-right">
                            <span className="font-bold uppercase tracking-wide block mb-1">{order.status}</span>
                            <div className="flex flex-col gap-1 text-xs text-gray-600 dark:text-gray-300 border-l-2 border-current/20 pl-2 ml-auto w-fit text-left">
                                <span className="block opacity-75">
                                    Placed: {new Date(order.date).toLocaleDateString()} {new Date(order.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                                {order.processingAt && (
                                    <span className="block opacity-75">
                                        Processed: {new Date(order.processingAt).toLocaleDateString()} {new Date(order.processingAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                {order.handOnCourierAt && (
                                    <span className="block opacity-75">
                                        Hand on Courier: {new Date(order.handOnCourierAt).toLocaleDateString()} {new Date(order.handOnCourierAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                {order.forwardedBy && (
                                    <span className="block font-medium text-orange-600 dark:text-orange-400">
                                        Forwarded by: {order.forwardedBy}
                                    </span>
                                )}
                                {order.shippedAt && order.status === 'Shipped' && (
                                    <span className="block opacity-75">
                                        Shipped: {new Date(order.shippedAt).toLocaleDateString()} {new Date(order.shippedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                                {order.deliveredAt && (
                                    <>
                                        <span className="block font-medium text-green-600 dark:text-green-300">
                                            Delivered: {new Date(order.deliveredAt).toLocaleDateString()} {new Date(order.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {order.deliveredBy && (
                                            <span className="block font-medium text-orange-600 dark:text-orange-400">
                                                Delivered by: {deliveredByCourier ? `${deliveredByCourier.id} ` : ''}{order.deliveredBy}
                                            </span>
                                        )}
                                    </>
                                )}
                                {order.cancelledAt && (
                                    <span className="block font-medium text-red-600 dark:text-red-300">
                                        Cancelled: {new Date(order.cancelledAt).toLocaleDateString()} {new Date(order.cancelledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                        {/* Customer Info */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <User size={16} /> Customer Details
                            </h3>
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl space-y-3">
                                <p className="font-medium text-gray-900 dark:text-white">{order.customer?.name}</p>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Mail size={14} /> {order.customer?.email}
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Phone size={14} /> {order.customer?.phone}
                                </div>
                            </div>
                        </div>

                        {/* Shipping Address */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <MapPin size={16} /> Shipping Address
                            </h3>
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                <p>{order.customer?.address}</p>
                                <p>{order.customer?.city}{order.customer?.zip ? `, ${order.customer.zip}` : ''}</p>
                            </div>
                        </div>
                    </div>

                    {/* Order Items */}
                    <div>
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-4 flex items-center gap-2">
                            <ShoppingBag size={16} /> Order Items
                        </h3>
                        <div className="border rounded-xl overflow-hidden border-gray-100 dark:border-white/10">
                            <table className="w-full text-sm text-left">
                                <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                                    <tr>
                                        <th className="px-4 py-3 font-medium">Product</th>
                                        <th className="px-4 py-3 font-medium text-center">Qty</th>
                                        <th className="px-4 py-3 font-medium text-center">Size</th>
                                        <th className="px-4 py-3 font-medium text-center">Color</th>
                                        <th className="px-4 py-3 font-medium text-right">Price</th>
                                        <th className="px-4 py-3 font-medium text-right">Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100 dark:divide-white/10">
                                    {order.items?.map((item, index) => (
                                        <tr key={index} className="bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 bg-white dark:bg-gray-700 rounded-lg overflow-hidden shrink-0 border border-gray-200 dark:border-gray-600">
                                                        <img
                                                            src={item.image}
                                                            alt={item.name}
                                                            className="h-full w-full object-cover"
                                                        />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-900 dark:text-white">{item.name}</p>
                                                        {item.code && <p className="text-xs text-gray-500 font-mono">{item.code}</p>}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.quantity}</td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">{item.size || '-'}</td>
                                            <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-300">
                                                {item.color ? (
                                                    <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-gray-100 dark:bg-white/10 text-xs font-medium dark:text-gray-300">
                                                        <span className="w-2 h-2 rounded-full border border-gray-300 dark:border-gray-500" style={{ backgroundColor: item.color === 'White' ? '#ffffff' : item.color.toLowerCase() }}></span>
                                                        {item.color}
                                                    </span>
                                                ) : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right text-gray-600 dark:text-gray-300">{formatPrice(item.price)}</td>
                                            <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                                                {formatPrice(item.price * item.quantity)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot className="bg-gray-50 dark:bg-white/5 border-t border-gray-100 dark:border-white/10">
                                    <tr>
                                        <td colSpan="5" className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">Total Amount</td>
                                        <td className="px-4 py-3 text-right font-bold text-primary-600 text-lg whitespace-nowrap">
                                            {formatPrice(order.total)}
                                        </td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default OrderDetailsModal;
