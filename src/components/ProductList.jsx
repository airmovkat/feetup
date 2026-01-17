import { useState, useMemo } from 'react';
import ProductCard from './ProductCard';
import { useProducts } from './ProductContext';
import { motion, AnimatePresence } from 'framer-motion';

const ProductList = ({ category: pageCategory }) => {
    const { products } = useProducts();
    const [selectedFilter, setSelectedFilter] = useState('All');

    // 1. Initial filtered list based on the Page (Men/Women/Sale)
    const baseProducts = useMemo(() => {
        if (!pageCategory) return products;
        if (pageCategory === 'sale') return products.filter(p => p.isOnSale === true);
        if (pageCategory === 'men') return products.filter(p => p.gender === 'men' || p.gender === 'unisex');
        if (pageCategory === 'women') return products.filter(p => p.gender === 'women' || p.gender === 'unisex');
        return products;
    }, [products, pageCategory]);

    // 2. Extract unique categories for the Filter Bar
    const availableCategories = useMemo(() => {
        const cats = new Set(baseProducts.map(p => p.category).filter(Boolean));
        return ['All', ...Array.from(cats).sort()];
    }, [baseProducts]);

    // 3. Final Display List based on selected Filter
    const displayProducts = useMemo(() => {
        if (selectedFilter === 'All') return baseProducts;
        return baseProducts.filter(p => p.category === selectedFilter);
    }, [baseProducts, selectedFilter]);

    return (
        <div>
            <div className="mb-8 overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex gap-3">
                    {availableCategories.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setSelectedFilter(cat)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-200 border ${selectedFilter === cat
                                ? 'bg-gray-900 dark:bg-white text-white dark:text-gray-900 border-gray-900 dark:border-white shadow-md transform scale-105'
                                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
                                }`}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Product Grid */}
            <motion.div
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
            >
                <AnimatePresence mode='popLayout'>
                    {displayProducts.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="col-span-full text-center py-12"
                        >
                            <p className="text-gray-500 dark:text-gray-400 text-lg">
                                No products found in this category.
                            </p>
                        </motion.div>
                    ) : (
                        displayProducts.map((product) => (
                            <motion.div
                                key={product.id}
                                layout
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ duration: 0.2 }}
                            >
                                <ProductCard product={product} />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default ProductList;
