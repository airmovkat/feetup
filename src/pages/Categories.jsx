import ProductList from '../components/ProductList';

export const Men = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Men's Collection</h1>
        <ProductList category="men" />
    </div>
);

export const Women = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Women's Collection</h1>
        <ProductList category="women" />
    </div>
);

export const Sale = () => (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Sale Items</h1>
        <ProductList category="sale" />
    </div>
);
