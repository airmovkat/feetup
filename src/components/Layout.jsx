import Header from './Header';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop';

import { useLocation } from 'react-router-dom';

const Layout = ({ children }) => {
    const location = useLocation();
    const isAdmin = location.pathname.startsWith('/admin');

    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-black transition-colors duration-200">
            <Header isAdmin={isAdmin} />
            <main className="flex-grow">
                {children}
            </main>
            {!isAdmin && <Footer />}
            <ScrollToTop />
        </div>
    );
};

export default Layout;
