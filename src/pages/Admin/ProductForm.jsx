
import { useState, useEffect } from 'react';
import { X, Lock } from 'lucide-react';

import { useProducts } from '../../components/ProductContext';
import { useCategories } from '../../components/CategoryContext';

const ProductForm = ({ product, onSubmit, onCancel }) => {
    const { products } = useProducts();
    const { categories } = useCategories();
    const [formData, setFormData] = useState({
        code: '',
        name: '',
        price: '',
        gender: '',
        category: '',
        isFeatured: false,
        isOnSale: false,
        description: '',
        image: '',
        stock: 0,
        addStock: ''  // Temporary field for adding stock in edit mode
    });

    const [isStockUnlocked, setIsStockUnlocked] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
    const [passwordInput, setPasswordInput] = useState('');
    const [passwordError, setPasswordError] = useState('');

    const handlePasswordVerify = (e) => {
        e?.preventDefault();
        e?.stopPropagation();
        if (passwordInput === 'admin123') {
            setIsStockUnlocked(true);
            setIsPasswordModalOpen(false);
            setPasswordInput('');
            setPasswordError('');
        } else {
            setPasswordError('Incorrect password');
        }
    };

    useEffect(() => {
        if (product) {
            setFormData(product);
        }
    }, [product]);

    // Auto-generate code for new products based on selection
    useEffect(() => {
        if (!product && formData.category && formData.gender) {
            const prefix = formData.category.substring(0, 3).toUpperCase();
            const genderCode = formData.gender.substring(0, 1).toUpperCase();

            // Calculate next sequence for preview
            let currentMax = 0;
            products.forEach(p => {
                if (p.code) {
                    const match = p.code.match(/(\d+)$/);
                    if (match) {
                        const num = parseInt(match[0], 10);
                        if (!isNaN(num)) {
                            currentMax = Math.max(currentMax, num);
                        }
                    }
                }
            });

            const nextSuffix = String(currentMax + 1).padStart(3, '0');
            const newCode = `${prefix}-${genderCode}-${nextSuffix}`;

            setFormData(prev => ({ ...prev, code: newCode }));
        }
    }, [formData.category, formData.gender, product, products]);

    const handleSubmit = (e) => {
        e.preventDefault();

        // Calculate final stock
        let finalStock = parseInt(formData.stock || 0);
        if (product && formData.addStock) {
            finalStock += parseInt(formData.addStock);
        }

        const submission = {
            ...formData,
            price: parseFloat(formData.price),
            stock: finalStock,
            addStock: undefined // Do not send this aux field
        };
        onSubmit(submission);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-hidden backdrop-blur-sm">
            <div className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 rounded-2xl w-full max-w-md max-h-[90vh] flex flex-col shadow-2xl animate-in fade-in zoom-in duration-200 border border-gray-100 dark:border-transparent">
                {/* Fixed Header */}
                <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/10 shrink-0">
                    <h2 className="text-xl font-bold dark:text-white">
                        {product ? 'Edit Product' : 'Add New Product'}
                    </h2>
                    <button type="button" onClick={onCancel} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
                        <X size={24} />
                    </button>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto flex-1">
                    <form id="product-form" onSubmit={handleSubmit} className="space-y-4">
                        {/* Code Field (Auto-generated/Read-only) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Product Code</label>
                            <input
                                type="text"
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400 bg-gray-100 shadow-sm p-2 border cursor-not-allowed font-mono text-sm"
                                value={formData.code || 'Select Category & Gender to generate'}
                                readOnly
                                disabled
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
                            <input
                                type="text"
                                required
                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Price</label>
                            <input
                                type="number"
                                step="0.01"
                                required
                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                value={formData.price}
                                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            />
                        </div>

                        {/* Stock Management */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                {product ? 'Current Stock' : 'Initial Stock'}
                            </label>
                            <input
                                type="number"
                                min="0"
                                required={!product}
                                readOnly={!!product && !isStockUnlocked}
                                onClick={() => {
                                    if (product && !isStockUnlocked) {
                                        setIsPasswordModalOpen(true);
                                    }
                                }}
                                className={`w-full rounded-lg border p-2 shadow-sm transition-colors ${product && !isStockUnlocked
                                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-500 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600 border-gray-300 dark:border-gray-600'
                                    : 'border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white focus:border-primary-500 focus:ring-primary-500'
                                    }`}
                                value={formData.stock || 0}
                                onChange={(e) => (!product || isStockUnlocked) && setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
                                title={product && !isStockUnlocked ? "Click to unlock editing" : ""}
                            />
                        </div>

                        {/* Add New Stock Field (Only for Edit Mode) */}
                        {product && (
                            <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-xl border border-gray-200 dark:border-white/10 animate-in slide-in-from-top-2">
                                <label className="block text-sm font-bold text-green-600 dark:text-green-400 mb-1">
                                    + Add New Stock
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="number"
                                        min="0"
                                        placeholder="Qty to add"
                                        className="flex-1 rounded-lg border-green-300 dark:border-green-800 bg-white dark:bg-black/20 dark:text-white shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
                                        value={formData.addStock || ''}
                                        onChange={(e) => setFormData({ ...formData, addStock: e.target.value })}
                                    />
                                    <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                        New Total: <span className="font-bold text-gray-900 dark:text-white">{(parseInt(formData.stock || 0) + (parseInt(formData.addStock) || 0))}</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
                            <select
                                required
                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                            >
                                <option value="" className="bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white">Select Main Category</option>
                                {categories.mainCategories.map(cat => (
                                    <option key={cat.id} value={cat.id} className="bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white">{cat.name}</option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
                            <select
                                required
                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-[#2a2a2a] dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                value={formData.category}
                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                            >
                                <option value="" className="bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white">Select Sub Category</option>
                                {categories.subCategories.map(cat => (
                                    <option key={cat.id} value={cat.name} className="bg-white dark:bg-[#2a2a2a] text-gray-900 dark:text-white">{cat.name}</option>
                                ))}
                            </select>
                            {/* Note: value={cat.name} used for subcategory to match existing data which stores name like 'Running' not 'running' */}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Available Colors</label>
                            <div className="flex gap-2 mb-2 flex-wrap">
                                {['Black', 'White', 'Red', 'Blue', 'Green', 'Navy', 'Grey', 'Orange'].map((color) => {
                                    const colorMap = {
                                        'Black': '#000000', 'White': '#ffffff', 'Red': '#ef4444',
                                        'Blue': '#3b82f6', 'Green': '#22c55e', 'Navy': '#1e3a8a',
                                        'Grey': '#6b7280', 'Orange': '#f97316'
                                    };
                                    return (
                                        <button
                                            key={color}
                                            type="button"
                                            onClick={() => {
                                                const currentColors = formData.colors || [];
                                                const newColors = currentColors.includes(color)
                                                    ? currentColors.filter(c => c !== color)
                                                    : [...currentColors, color];
                                                setFormData({ ...formData, colors: newColors });
                                            }}
                                            className={`px-3 py-1.5 text-xs rounded-full border flex items-center gap-2 transition-all ${(formData.colors || []).includes(color)
                                                ? 'bg-primary-50 text-primary-700 border-primary-500 ring-1 ring-primary-500'
                                                : 'bg-white dark:bg-gray-100/5 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-white/10 hover:border-primary-400'
                                                }`}
                                        >
                                            <span className="w-3 h-3 rounded-full border border-gray-200 shadow-sm" style={{ backgroundColor: colorMap[color] }}></span>
                                            {color}
                                        </button>
                                    )
                                })}
                            </div>
                            <input
                                type="text"
                                placeholder="Or type custom colors (comma separated)..."
                                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border text-sm"
                                value={(formData.colors || []).join(', ')}
                                onChange={(e) => setFormData({
                                    ...formData,
                                    colors: e.target.value.split(',').map(c => c.trim()).filter(Boolean)
                                })}
                            />
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Select standard colors or type custom ones.</p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Image URL</label>
                            <input
                                type="url"
                                required
                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                value={formData.image}
                                onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                            <textarea
                                required
                                rows="3"
                                className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        {/* Featured and Sale Checkboxes */}
                        <div className="space-y-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isFeatured"
                                    checked={formData.isFeatured}
                                    onChange={(e) => setFormData({ ...formData, isFeatured: e.target.checked })}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Featured Product (Show in homepage carousel)
                                </label>
                            </div>
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="isOnSale"
                                    checked={formData.isOnSale}
                                    onChange={(e) => setFormData({ ...formData, isOnSale: e.target.checked })}
                                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isOnSale" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                                    Sale Product (Show in sale page)
                                </label>
                            </div>

                            {/* Discount Logic */}
                            {formData.isOnSale && (
                                <div className="animate-in slide-in-from-top-2 pt-2">
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        Discount Percentage (0 to 100)
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        className="w-full rounded-lg border-gray-300 dark:border-white/10 dark:bg-white/5 dark:text-white shadow-sm focus:border-primary-500 focus:ring-primary-500 p-2 border"
                                        value={formData.discountPercentage !== undefined ? formData.discountPercentage : 0}
                                        onChange={(e) => setFormData({ ...formData, discountPercentage: parseInt(e.target.value) || 0 })}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Set to <strong>0</strong> to show as "Sale" but keep original price.
                                    </p>
                                </div>
                            )}
                        </div>
                    </form>
                </div>

                {/* Fixed Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/10 bg-gray-50 dark:bg-white/5 shrink-0 flex justify-end space-x-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 dark:bg-white/10 dark:text-gray-200 dark:border-white/10 dark:hover:bg-white/20 shadow-sm transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        form="product-form"
                        className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 shadow-sm"
                    >
                        {product ? 'Update Product' : 'Add Product'}
                    </button>
                </div>
            </div>

            {/* Password Verification Modal */}
            {isPasswordModalOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-xl w-full max-w-sm border border-gray-100 dark:border-gray-700 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
                        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white flex items-center gap-2">
                            <Lock size={20} className="text-primary-600" />
                            Unlock Stock Modification
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                            Please enter the admin password to unlock the stock field.
                        </p>
                        <input
                            type="password"
                            autoFocus
                            className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 text-sm dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="Admin Password"
                            value={passwordInput}
                            onChange={e => {
                                setPasswordInput(e.target.value);
                                setPasswordError('');
                            }}
                            onKeyDown={e => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    handlePasswordVerify();
                                }
                            }}
                        />
                        {passwordError && <p className="text-red-500 text-xs mb-3 font-medium">{passwordError}</p>}
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => { setIsPasswordModalOpen(false); setPasswordInput(''); setPasswordError(''); }}
                                className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handlePasswordVerify}
                                className="px-4 py-2 text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-lg transition-colors shadow-sm"
                            >
                                Unlock
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductForm;
