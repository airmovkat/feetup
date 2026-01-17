import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { adminUser } = useAuth();
    const [notifications, setNotifications] = useState([]); // Toasts
    const [persistentNotifications, setPersistentNotifications] = useState([]); // Persistent

    // Poll for notifications if admin is logged in
    useEffect(() => {
        let interval;
        if (adminUser) {
            fetchNotifications();
            interval = setInterval(fetchNotifications, 5000); // Poll every 5 seconds
        } else {
            setPersistentNotifications([]);
        }
        return () => clearInterval(interval);
    }, [adminUser]);

    const fetchNotifications = async () => {
        if (!adminUser) return;
        try {
            const role = adminUser.role;
            const res = await fetch(`/api/notifications?role=${role}`);
            if (res.ok) {
                const data = await res.json();
                setPersistentNotifications(data);
            }
        } catch (err) {
            console.error("Failed to fetch notifications", err);
        }
    };

    const showNotification = useCallback((message, type = 'success') => {
        const id = Date.now();
        setNotifications((prev) => [...prev, { id, message, type }]);

        // Auto-remove after 3 seconds
        setTimeout(() => {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
        }, 3000);
    }, []);

    const addPersistentNotification = useCallback(async (title, message, type = 'order', targetRoles = null) => {
        try {
            // Determine targets: specific roles or default 'owner' if null?
            // Actually, if targetRoles is passed as array, we create one for each.
            // If it's null, we assume it's for everyone (but we want to avoid that now for deletion purposes).
            // Let's force targetRoles to be an array if it's null (default to ['owner', 'seller'] for general ones? No, safer to just use what's passed).
            // Existing callers pass ['owner', 'seller'].

            const targets = targetRoles || ['owner']; // Default to owner if nothing specified

            // We must create SEPARATE notifications for each role so they can be deleted independently.
            const promises = targets.map(role =>
                fetch('/api/notifications', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        title,
                        message,
                        type,
                        target_role: role // Explicit role, no null/broadcast
                    })
                })
            );

            await Promise.all(promises);

            if (adminUser) fetchNotifications();

        } catch (e) {
            console.error("Failed to add notification", e);
        }
    }, [adminUser]);

    const markAllAsRead = useCallback(async () => {
        setPersistentNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        try {
            await fetch('/api/notifications/read', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' }
            });
            fetchNotifications();
        } catch (err) {
            console.error("Failed to mark read", err);
        }
    }, []);

    const removeNotification = useCallback((id) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    const clearAllPersistent = useCallback(async () => {
        setPersistentNotifications([]); // Optimistic
        if (!adminUser?.role) return;

        try {
            // Delete only for my role
            await fetch(`/api/notifications?role=${adminUser.role}`, { method: 'DELETE' });
        } catch (err) {
            console.error("Failed to clear notifications", err);
        }
    }, [adminUser]);

    const unreadCount = persistentNotifications.filter(n => !n.isRead).length;

    return (
        <NotificationContext.Provider value={{
            showNotification,
            removeNotification,
            notifications,
            persistentNotifications,
            addPersistentNotification,
            markAllAsRead,
            clearAllPersistent,
            unreadCount
        }}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotification = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotification must be used within a NotificationProvider');
    }
    return context;
};
