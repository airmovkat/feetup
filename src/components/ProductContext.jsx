import { createContext, useContext, useState, useEffect } from 'react';

const ProductContext = createContext();

export const ProductsProvider = ({ children }) => {
    const [products, setProducts] = useState([]);

    // 1. Fetch Products from Backend
    const fetchProducts = async () => {
        try {
            const res = await fetch('/api/products');
            if (res.ok) {
                const data = await res.json();
                setProducts(data);
            } else {
                console.error("Failed to fetch products");
            }
        } catch (error) {
            console.error("Error loading products:", error);
        }
    };

    useEffect(() => {
        fetchProducts();

        // Poll for updates every 5 seconds to sync between tabs/browsers
        const interval = setInterval(fetchProducts, 5000);
        return () => clearInterval(interval);
    }, []);

    const addProduct = async (product) => {
        try {
            const res = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(product)
            });
            if (res.ok) {
                const savedProduct = await res.json();
                setProducts(prev => [...prev, savedProduct]);
            }
        } catch (error) {
            console.error("Error adding product:", error);
        }
    };

    const updateProduct = async (id, updatedProduct) => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updatedProduct)
            });
            if (res.ok) {
                setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updatedProduct } : p));
            }
        } catch (error) {
            console.error("Error updating product:", error);
        }
    };

    const deleteProduct = async (id) => {
        try {
            const res = await fetch(`/api/products/${id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                setProducts(prev => prev.filter(p => p.id !== id));
            }
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };

    const updateStockForOrder = (orderItems) => {
        // Ideally handled by backend on order placement, but we can optimistically update or re-fetch
        fetchProducts();
    };

    return (
        <ProductContext.Provider value={{ products, addProduct, updateProduct, deleteProduct, updateStockForOrder }}>
            {children}
        </ProductContext.Provider>
    );
};

export const useProducts = () => useContext(ProductContext);
