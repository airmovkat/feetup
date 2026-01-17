import { createContext, useContext, useState, useEffect } from 'react';

const CategoryContext = createContext();

export const CategoryProvider = ({ children }) => {
    // Initial default data to match existing hardcoded values
    const defaultData = {
        mainCategories: [
            { id: 'men', name: "Men's" },
            { id: 'women', name: "Women's" },
            { id: 'unisex', name: "Unisex" },
            { id: 'kids', name: "Kids" }
        ],
        subCategories: [
            { id: 'running', name: 'Running' },
            { id: 'casual', name: 'Casual' },
            { id: 'hiking', name: 'Hiking' },
            { id: 'basketball', name: 'Basketball' },
            { id: 'lifestyle', name: 'Lifestyle' },
            { id: 'performance', name: 'Performance' },
            { id: 'training', name: 'Training' },
            { id: 'walking', name: 'Walking' },
            { id: 'adventure', name: 'Adventure' },
            { id: 'safety', name: 'Safety' },
            { id: 'specialized', name: 'Specialized' }
        ]
    };

    const [categories, setCategories] = useState(() => {
        try {
            const saved = localStorage.getItem('feetup_categories');
            return saved ? JSON.parse(saved) : defaultData;
        } catch (e) {
            console.error("Failed to parse categories:", e);
            return defaultData;
        }
    });

    useEffect(() => {
        localStorage.setItem('feetup_categories', JSON.stringify(categories));
    }, [categories]);

    // --- Actions ---

    const addMainCategory = (name) => {
        // Simple ID generation from name
        const id = name.toLowerCase().replace(/\s+/g, '-');
        if (categories.mainCategories.some(c => c.id === id)) return false; // Duplicate check

        setCategories(prev => ({
            ...prev,
            mainCategories: [...prev.mainCategories, { id, name }]
        }));
        return true;
    };

    const removeMainCategory = (id) => {
        setCategories(prev => ({
            ...prev,
            mainCategories: prev.mainCategories.filter(c => c.id !== id)
        }));
    };

    const addSubCategory = (name) => {
        const id = name.toLowerCase().replace(/\s+/g, '-');
        // Check loosely to avoid strict case duplicates if user types "running" vs "Running"
        if (categories.subCategories.some(c => c.id === id)) return false;

        setCategories(prev => ({
            ...prev,
            subCategories: [...prev.subCategories, { id, name }]
        }));
        return true;
    };

    const removeSubCategory = (id) => {
        setCategories(prev => ({
            ...prev,
            subCategories: prev.subCategories.filter(c => c.id !== id)
        }));
    };

    return (
        <CategoryContext.Provider value={{
            categories,
            addMainCategory,
            removeMainCategory,
            addSubCategory,
            removeSubCategory
        }}>
            {children}
        </CategoryContext.Provider>
    );
};

export const useCategories = () => {
    const context = useContext(CategoryContext);
    if (!context) {
        throw new Error('useCategories must be used within a CategoryProvider');
    }
    return context;
};
