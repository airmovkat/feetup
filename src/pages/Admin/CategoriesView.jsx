import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Trash2, Tag, Layers, Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCategories } from '../../components/CategoryContext';

// Reusable Editable Item Component
const EditableCategoryItem = ({ item, onDeleteClick }) => {
    return (
        <div className="flex items-center justify-between p-3 bg-white dark:bg-white/5 dark:backdrop-blur-md dark:border-white/10 rounded-2xl border border-gray-100 shadow-sm group hover:shadow-lg transition-all">
            <span className="text-gray-700 dark:text-gray-300 font-medium">{item.name}</span>
            <button
                onClick={() => onDeleteClick(item)}
                className="p-2 text-gray-700 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors"
                title="Delete Category"
            >
                <Trash2 size={16} />
            </button>
        </div>
    );
};

const CategoriesView = ({ showNotification }) => {
    const { categories, addMainCategory, removeMainCategory, addSubCategory, removeSubCategory } = useCategories();

    const [newMainCat, setNewMainCat] = useState('');
    const [newSubCat, setNewSubCat] = useState('');

    // Delete Modal State
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null); // { id, name, type: 'main'|'sub' }
    const [deletePassword, setDeletePassword] = useState('');

    const handleAddMain = (e) => {
        e.preventDefault();
        if (!newMainCat.trim()) return;

        if (addMainCategory(newMainCat.trim())) {
            showNotification('Main category added!', 'success');
            setNewMainCat('');
        } else {
            showNotification('Category already exists!', 'error');
        }
    };

    const handleAddSub = (e) => {
        e.preventDefault();
        if (!newSubCat.trim()) return;

        if (addSubCategory(newSubCat.trim())) {
            showNotification('Sub category added!', 'success');
            setNewSubCat('');
        } else {
            showNotification('Category already exists!', 'error');
        }
    };

    const handleDeleteClick = (item, type) => {
        setItemToDelete({ ...item, type });
        setDeletePassword('');
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (deletePassword === 'password123') {
            if (itemToDelete) {
                if (itemToDelete.type === 'main') {
                    removeMainCategory(itemToDelete.id);
                } else {
                    removeSubCategory(itemToDelete.id);
                }
                showNotification('Category removed successfully', 'success');
            }
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
        } else {
            showNotification('Incorrect password! Deletion cancelled', 'error');
        }
    };

    return (
        <div className="space-y-6">

            {/* Delete Confirmation Modal */}
            {createPortal(
                <AnimatePresence>
                    {isDeleteModalOpen && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/10 backdrop-blur-sm"
                            onClick={() => setIsDeleteModalOpen(false)}
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-2xl w-full max-w-sm border border-gray-100 dark:border-gray-700 mx-4"
                                onClick={e => e.stopPropagation()}
                            >
                                <h3 className="text-lg font-bold mb-2 text-red-600 flex items-center gap-2">
                                    <Trash2 size={20} />
                                    Delete Category
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                    Are you sure you want to delete <strong>{itemToDelete?.name}</strong>?
                                </p>

                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Admin Password</label>
                                <input
                                    type="password"
                                    autoComplete="new-password"
                                    className="w-full p-2 border border-gray-200 dark:border-gray-700 rounded-lg mb-4 text-sm dark:bg-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 outline-none"
                                    placeholder="Enter password"
                                    value={deletePassword}
                                    onChange={e => setDeletePassword(e.target.value)}
                                />

                                <div className="flex justify-end gap-3">
                                    <button
                                        onClick={() => setIsDeleteModalOpen(false)}
                                        className="px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDelete}
                                        className="px-4 py-2 text-sm font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                        disabled={!deletePassword}
                                    >
                                        Delete
                                    </button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}

            {/* Main Content Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white dark:bg-white/10 dark:backdrop-blur-2xl dark:border-white/20 dark:shadow-xl shadow-md rounded-2xl overflow-hidden relative border border-gray-100 dark:border-transparent"
            >
                {/* Card Header */}
                <div className="p-6 border-b border-gray-100 dark:border-white/10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold dark:text-white">Category Management</h2>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your product classifications and filtering options.</p>
                    </div>
                </div>

                {/* Card Content */}
                <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Main Categories Panel */}
                        <div className="bg-gray-50 dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                                    <Layers size={24} />
                                </div>
                                <h3 className="text-xl font-bold dark:text-white">Main Categories</h3>
                            </div>

                            {/* Add Form */}
                            <form onSubmit={handleAddMain} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="e.g. Kids, Accessories"
                                    className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-primary-500 focus:border-primary-500 p-2 border"
                                    value={newMainCat}
                                    onChange={e => setNewMainCat(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors shadow-sm"
                                >
                                    <Plus size={24} />
                                </button>
                            </form>

                            {/* List */}
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {categories.mainCategories.map(cat => (
                                    <EditableCategoryItem
                                        key={cat.id}
                                        item={cat}
                                        onDeleteClick={(item) => handleDeleteClick(item, 'main')}
                                    />
                                ))}
                                {categories.mainCategories.length === 0 && (
                                    <p className="text-gray-400 text-center py-4 italic">No main categories found.</p>
                                )}
                            </div>
                        </div>

                        {/* Sub Categories Panel */}
                        <div className="bg-gray-50 dark:bg-white/5 dark:backdrop-blur-md rounded-2xl p-6">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="bg-orange-100 dark:bg-orange-900/30 p-2 rounded-lg text-orange-600 dark:text-orange-400">
                                    <Tag size={24} />
                                </div>
                                <h3 className="text-xl font-bold dark:text-white">Sub Categories</h3>
                            </div>

                            {/* Add Form */}
                            <form onSubmit={handleAddSub} className="flex gap-2 mb-6">
                                <input
                                    type="text"
                                    autoComplete="off"
                                    placeholder="e.g. Loafers, Boots"
                                    className="flex-1 rounded-lg border-gray-300 dark:border-gray-600 dark:bg-gray-800 dark:text-white shadow-sm focus:ring-primary-500 focus:border-primary-500 p-2 border"
                                    value={newSubCat}
                                    onChange={e => setNewSubCat(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    className="bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-lg transition-colors shadow-sm"
                                >
                                    <Plus size={24} />
                                </button>
                            </form>

                            {/* List */}
                            <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {categories.subCategories.map(cat => (
                                    <EditableCategoryItem
                                        key={cat.id}
                                        item={cat}
                                        onDeleteClick={(item) => handleDeleteClick(item, 'sub')}
                                    />
                                ))}
                                {categories.subCategories.length === 0 && (
                                    <p className="text-gray-400 text-center py-4 italic">No sub categories found.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default CategoriesView;
