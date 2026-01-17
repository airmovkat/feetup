import { createContext, useContext, useState, useEffect } from 'react';
import { sendVerificationCode, sendPasswordResetCode } from '../utils/emailService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    // --- ADMIN AUTH ---
    const [adminUser, setAdminUser] = useState(() => {
        const saved = sessionStorage.getItem('currentAdminUser');
        return saved ? JSON.parse(saved) : null;
    });

    const [adminUsers, setAdminUsers] = useState([]);

    // Fetch Admin Users if Authenticated (Poll for real-time status)
    useEffect(() => {
        let interval;
        if (adminUser) {
            fetchAdminUsers(); // Initial fetch
            interval = setInterval(fetchAdminUsers, 5000); // Poll every 5 seconds
        }
        return () => clearInterval(interval);
    }, [adminUser]);

    const fetchAdminUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setAdminUsers(data);
                localStorage.setItem('adminUsers', JSON.stringify(data)); // Sync for NotificationContext
            }
        } catch (err) {
            console.error("Failed to load admin users", err);
        }
    };

    const adminLogin = async (username, password) => {
        try {
            const res = await fetch('/api/admin/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await res.json();

            if (data.success) {
                setAdminUser(data.user);
                sessionStorage.setItem('currentAdminUser', JSON.stringify(data.user));
                return true;
            }
            return false;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    const addAdminUser = async (userData) => {
        try {
            const res = await fetch('/api/admin/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (res.ok) {
                fetchAdminUsers();
            }
        } catch (err) {
            console.error("Failed to add admin user", err);
        }
    };

    const updateAdminUser = async (userData) => {
        try {
            const res = await fetch(`/api/admin/users/${userData.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            if (res.ok) {
                fetchAdminUsers();
            }
        } catch (err) {
            console.error("Failed to update admin user", err);
        }
    };

    const deleteAdminUser = async (id) => {
        try {
            const res = await fetch(`/api/admin/users/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchAdminUsers();
            }
        } catch (err) {
            console.error("Failed to delete admin user", err);
        }
    };

    const adminLogout = async () => {
        if (adminUser?.id) {
            try {
                // Determine if we need to call logout endpoint
                // Since there's no email for admin login, we use ID or name handling in generic backend?
                // Actually my new endpoint uses ID.
                await fetch('/api/admin/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ id: adminUser.id })
                });
            } catch (e) { console.error("Admin logout failed", e); }
        }
        setAdminUser(null);
        setAdminUsers([]);
        sessionStorage.removeItem('currentAdminUser');
        window.location.href = '/admin/login'; // Force refresh and redirect
    };

    const isAdminAuthenticated = !!adminUser;

    // Compute Active Admin Ids based on isOnline flag from DB
    const activeAdminIds = adminUsers
        .filter(u => u.isOnline === 1 || u.isOnline === true)
        .map(u => u.id);

    // --- USER AUTH ---
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('currentUser');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [wishlist, setWishlist] = useState([]);

    const login = async (email, password) => {
        try {
            const res = await fetch('/api/users/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                return { success: true, user: data.user };
            }
            return { success: false, message: data.message };
        } catch (err) {
            return { success: false, message: 'Server error' };
        }
    };

    const signup = async (userData) => {
        // Generate code on client side for now to be compatible with client-side email service
        const verificationCode = Math.floor(1000 + Math.random() * 9000).toString();
        try {
            // 1. Create User in DB
            const res = await fetch('/api/users/signup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...userData, verificationCode })
            });
            const data = await res.json();

            if (data.success) {
                // 2. Send Email via EmailJS (Client Side)
                console.log("Sending verification email to:", userData.email);
                await sendVerificationCode(userData.email, userData.name, verificationCode);

                return { ...data.user, verificationCode };
            }
            throw new Error(data.message || 'Signup failed');
        } catch (err) {
            console.error(err);
            throw err;
        }
    };

    const logout = async () => {
        if (user?.email) {
            try {
                // Inform server of logout (set offline)
                await fetch('/api/users/logout', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email: user.email })
                });
            } catch (e) { console.error("Logout API failed", e); }
        }
        setUser(null);
        localStorage.removeItem('currentUser');
        window.location.href = '/'; // Force refresh to clear all states and UI
    };

    const updateUser = async (userData) => {
        if (!user) return;
        const userId = user._id || user.id;
        try {
            const res = await fetch(`/api/users/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();
            if (data.success) {
                setUser(data.user);
                localStorage.setItem('currentUser', JSON.stringify(data.user));
                if (data.user._id || data.user.id) loadWishlist(data.user._id || data.user.id);
                return { success: true };
            }
            return { success: false, message: data.message };
        } catch (err) {
            console.error("Update failed", err);
            return { success: false, message: "Network error" };
        }
    };

    // Load wishlist from server
    const loadWishlist = async (userId) => {
        try {
            const res = await fetch(`/api/wishlist/${userId}`);
            if (res.ok) {
                const ids = await res.json();
                setWishlist(ids);
            }
        } catch (err) {
            console.error("Failed to load wishlist", err);
        }
    };

    const toggleWishlist = async (productId) => {
        if (!user) {
            alert("Please login to use wishlist");
            return;
        }

        const isLiked = wishlist.includes(productId);
        let newWishlist;

        if (isLiked) {
            newWishlist = wishlist.filter(id => id !== productId);
            setWishlist(newWishlist); // Optimistic
            try {
                // Use _id or id
                const userId = user._id || user.id;
                await fetch(`/api/wishlist/${userId}/${productId}`, { method: 'DELETE' });
            } catch (err) {
                console.error("Failed to remove from wishlist", err);
                setWishlist(prev => [...prev, productId]); // Revert
            }
        } else {
            newWishlist = [...wishlist, productId];
            setWishlist(newWishlist); // Optimistic
            try {
                await fetch('/api/wishlist', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user._id || user.id, productId })
                });
            } catch (err) {
                console.error("Failed to add to wishlist", err);
                setWishlist(prev => prev.filter(id => id !== productId)); // Revert
            }
        }
    };

    const verifyEmail = async (email, code) => {
        try {
            const res = await fetch('/api/users/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, code })
            });
            const data = await res.json();

            if (res.status === 404) {
                // User doesn't exist in DB (ghost session), force logout
                logout();
                return { success: false, message: 'Account not found. Please sign up again.' };
            }

            if (data.success) {
                const updatedUser = { ...user, isVerified: 1 };
                setUser(updatedUser);
                localStorage.setItem('currentUser', JSON.stringify(updatedUser)); // Persist locally immediately
                return { success: true };
            }
            return { success: false, message: data.message || 'Verification failed' };
        } catch (err) {
            console.error("Verification failed", err);
            return { success: false, message: 'Server connection failed' };
        }
    };

    const resendVerificationEmail = async (email, name, code) => {
        return await sendVerificationCode(email, name, code);
    };

    const [registeredUsers, setRegisteredUsers] = useState([]);

    useEffect(() => {
        let interval;
        if (isAdminAuthenticated) {
            fetchRegisteredUsers(); // Initial fetch
            interval = setInterval(fetchRegisteredUsers, 5000); // Poll every 5 seconds
        }
        return () => clearInterval(interval);
    }, [isAdminAuthenticated]);

    const fetchRegisteredUsers = async () => {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setRegisteredUsers(data);
            }
        } catch (err) {
            console.error("Failed to load users", err);
        }
    };

    // User Delete Function (for Admin)
    const deleteUser = async (id) => {
        try {
            const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchRegisteredUsers();
            }
        } catch (err) {
            console.error("Failed to delete user", err);
        }
    };

    return (
        <AuthContext.Provider value={{
            isAdminAuthenticated,
            adminLogin,
            adminLogout,
            adminUser,
            adminUsers,
            addAdminUser,
            updateAdminUser,
            deleteAdminUser,
            activeAdminIds,
            user,
            login,
            signup,
            logout,
            updateUser,
            wishlist,
            toggleWishlist,
            verifyEmail,
            resendVerificationEmail,
            registeredUsers,
            deleteUser
        }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
