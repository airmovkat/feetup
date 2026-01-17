import { createContext, useContext, useState, useEffect } from 'react';
import { useNotification } from './NotificationContext';

const OrderContext = createContext();

export const OrderProvider = ({ children }) => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showNotification, addPersistentNotification } = useNotification();

    const fetchOrders = async () => {
        try {
            const res = await fetch('/api/orders');
            if (res.ok) {
                const data = await res.json();
                setOrders(data);
            }
        } catch (err) {
            console.error("Failed to load orders", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders(); // Initial load

        // Poll for updates every 5 seconds (Simple real-time simulation)
        const interval = setInterval(fetchOrders, 5000);
        return () => clearInterval(interval);
    }, []);

    const addOrder = async (orderData) => {
        // Prepare payload without ID (server generates it)
        const newOrderPayload = {
            ...orderData,
            status: 'Pending',
            date: new Date().toISOString()
        };

        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newOrderPayload)
            });

            if (res.ok) {
                const result = await res.json();
                const completeOrder = { ...newOrderPayload, id: result.orderId };

                await fetchOrders(); // Refresh
                showNotification(`Order #${result.orderId} placed successfully! 🚀`, 'success');

                // Add persistent notification for admins
                addPersistentNotification(
                    'New Order Received',
                    `Order #${result.orderId} has been placed by ${orderData.customer?.name || orderData.customer_name || 'Guest'}.`,
                    'order',
                    ['owner', 'seller'] // Notify owners and sellers
                );

                return completeOrder;
            } else {
                showNotification('Failed to place order.', 'error');
            }
        } catch (err) {
            console.error("Failed to add order", err);
            showNotification('Network error while placing order.', 'error');
        }
        return null;
    };

    const updateOrderStatus = async (orderId, newStatus, actionBy = null) => {
        // Map status to timestamp column
        const statusToTimestamp = {
            'Processing': 'processingAt',
            'Hand on Courier': 'handOnCourierAt',
            'Shipped': 'shippedAt',
            'Delivered': 'deliveredAt',
            'Cancelled': 'cancelledAt'
        };
        const timestampField = statusToTimestamp[newStatus];
        const now = new Date().toISOString();

        // Optimistic Update
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                const updatedOrder = {
                    ...o,
                    status: newStatus,
                    // Optimistically update the timestamp if applicable
                    ...(timestampField ? { [timestampField]: now } : {})
                };

                // Clear fields optimistically based on regression
                if (newStatus === 'Pending') {
                    updatedOrder.processingAt = null;
                    updatedOrder.handOnCourierAt = null;
                    updatedOrder.shippedAt = null;
                    updatedOrder.deliveredAt = null;
                    updatedOrder.cancelledAt = null;
                    updatedOrder.forwardedBy = null;
                    updatedOrder.deliveredBy = null;
                } else if (newStatus === 'Processing') {
                    updatedOrder.handOnCourierAt = null;
                    updatedOrder.shippedAt = null;
                    updatedOrder.deliveredAt = null;
                    updatedOrder.cancelledAt = null;
                    updatedOrder.forwardedBy = null;
                    updatedOrder.deliveredBy = null;
                } else if (newStatus === 'Hand on Courier') {
                    updatedOrder.shippedAt = null;
                    updatedOrder.deliveredAt = null;
                    updatedOrder.cancelledAt = null;
                    updatedOrder.deliveredBy = null;
                    if (actionBy) updatedOrder.forwardedBy = actionBy;
                } else if (newStatus === 'Delivered') {
                    updatedOrder.cancelledAt = null;
                    if (actionBy) updatedOrder.deliveredBy = actionBy;
                }

                return updatedOrder;
            }
            return o;
        }));

        try {
            const res = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus, actionBy, timestampField })
            });
            if (res.ok) {
                // Background refresh to get server timestamps (e.g. deliveredAt)
                fetchOrders();
                showNotification(`Order ${orderId} updated: ${newStatus}`, 'info');

                // Trigger persistent notification if Delivered
                if (newStatus === 'Delivered') {
                    addPersistentNotification(
                        'Order Delivered',
                        `Order #${orderId} has been successfully delivered.`,
                        'success',
                        ['owner', 'seller']
                    );
                }
            }
        } catch (err) {
            console.error("Failed to update status", err);
            showNotification('Failed to update status. Reverting...', 'error');
            fetchOrders(); // Revert on failure
        }
    };

    const markLabelPrinted = async (orderId) => {
        // Optimistic Update
        setOrders(prev => prev.map(o => {
            if (o.id === orderId) {
                return { ...o, isLabelPrinted: true };
            }
            return o;
        }));

        try {
            await fetch(`/api/orders/${orderId}/printed`, { method: 'PUT' });
        } catch (err) {
            console.error("Failed to mark label as printed", err);
            fetchOrders(); // Revert/Refresh on error
        }
    };

    const getStats = () => {
        const totalSales = orders
            .filter(o => o.status !== 'Cancelled')
            .reduce((sum, order) => sum + (Number(order.total) || 0), 0);

        const today = new Date().toISOString().split('T')[0];
        const todayOrders = orders.filter(o => o.date && o.date.startsWith(today)).length;
        const pendingOrders = orders.filter(o => o.status === 'Pending').length;
        const uniqueCustomers = new Set(orders.map(o => o.customer_email || o.customer?.email)).size;

        return { totalSales, todayOrders, pendingOrders, totalCustomers: uniqueCustomers };
    };

    const deleteOrder = async (orderId) => {
        try {
            const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE' });
            if (res.ok) {
                setOrders(prev => prev.filter(o => o.id !== orderId));
                showNotification(`Order #${orderId} deleted and stock restored`, 'success');
            } else {
                showNotification('Failed to delete order', 'error');
            }
        } catch (err) {
            console.error("Failed to delete order", err);
            showNotification('Error deleting order', 'error');
        }
    };

    return (
        <OrderContext.Provider value={{
            orders,
            loading,
            addOrder,
            updateOrderStatus,
            markLabelPrinted,
            getStats,
            deleteOrder
        }}>
            {children}
        </OrderContext.Provider>
    );
};

export const useOrders = () => useContext(OrderContext);
