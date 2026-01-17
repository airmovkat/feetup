import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const CartContext = createContext();

export const CartProvider = ({ children }) => {
    const { user } = useAuth(); // Get current user
    const [cart, setCart] = useState(() => {
        if (typeof window !== 'undefined') {
            const savedCart = localStorage.getItem('cart');
            return savedCart ? JSON.parse(savedCart) : [];
        }
        return [];
    });

    const [isCartOpen, setIsCartOpen] = useState(false);

    // Sync from DB when user logs in
    useEffect(() => {
        if (user?.id) {
            fetchCart(user.id);
        } else {
            // If logged out, relying on local storage or empty? 
            // We usually keep local storage for guests.
            // If we want to clear or switch context, we could.
            // For now, let's just leave the local cart effectively separate or merged manually.
        }
    }, [user?.id]);

    // Persist to LocalStorage (for guests or offline backup)
    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(cart));
    }, [cart]);

    const fetchCart = async (userId) => {
        try {
            const res = await fetch(`/api/cart/${userId}`);
            if (res.ok) {
                const dbCart = await res.json();
                // We might want to merge local items here if desired, but for now simple source of truth:
                // If DB has items, use them. If DB is empty but we have local items, maybe we should push them?
                // Let's just set cart to DB cart for "Automatic Fetch" requirement.
                if (dbCart.length > 0) {
                    setCart(dbCart);
                } else if (cart.length > 0) {
                    // If DB empty but we have local items, sync them to DB? 
                    // This handles "Guest -> Login" flow.
                    for (const item of cart) {
                        await fetch('/api/cart/add', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userId, product: item })
                        });
                    }
                }
            }
        } catch (err) {
            console.error("Failed to fetch cart", err);
        }
    };

    const addToCart = async (product) => {
        const qtyToAdd = product.selectedQty || 1;

        // Optimistic UI Update
        setCart((prevCart) => {
            const { selectedQty, ...productToStore } = product;
            const existingItem = prevCart.find((item) =>
                item.id === product.id && item.size === product.size && item.color === product.color
            );

            if (existingItem) {
                return prevCart.map((item) =>
                    (item.id === product.id && item.size === product.size && item.color === product.color)
                        ? { ...item, quantity: item.quantity + qtyToAdd }
                        : item
                );
            }
            return [...prevCart, { ...productToStore, quantity: qtyToAdd }];
        });

        // API Call
        if (user?.id) {
            try {
                // Ensure we send the essential fields
                const { selectedQty, ...productToStore } = product;
                await fetch('/api/cart/add', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        userId: user.id,
                        product: { ...productToStore, quantity: qtyToAdd }
                    })
                });
            } catch (err) {
                console.error("Failed to add to cart API", err);
            }
        }
    };

    const removeFromCart = async (productId, size, color) => {
        setCart((prevCart) => prevCart.filter((item) => !(item.id === productId && item.size === size && item.color === color)));

        if (user?.id) {
            try {
                await fetch('/api/cart/remove', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, productId, size, color })
                });
            } catch (err) {
                console.error("Failed to remove from cart API", err);
            }
        }
    };

    const updateQuantity = async (productId, size, color, newQuantity) => {
        if (newQuantity < 1) {
            removeFromCart(productId, size, color);
            return;
        }

        setCart((prevCart) =>
            prevCart.map((item) =>
                (item.id === productId && item.size === size && item.color === color) ? { ...item, quantity: newQuantity } : item
            )
        );

        if (user?.id) {
            try {
                await fetch('/api/cart/update', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ userId: user.id, productId, size, color, quantity: newQuantity })
                });
            } catch (err) {
                console.error("Failed to update cart quantity API", err);
            }
        }
    };

    const clearCart = async () => {
        setCart([]);
        if (user?.id) {
            try {
                await fetch(`/api/cart/${user.id}`, { method: 'DELETE' });
            } catch (err) {
                console.error("Failed to clear cart API", err);
            }
        }
    };

    const toggleCart = () => setIsCartOpen(!isCartOpen);

    const cartTotal = cart.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            addToCart,
            removeFromCart,
            updateQuantity,
            clearCart,
            isCartOpen,
            setIsCartOpen,
            toggleCart,
            cartTotal
        }}>
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => useContext(CartContext);
