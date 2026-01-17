import { Facebook, Twitter, Instagram, Mail, Phone, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
    return (
        <footer className="bg-white dark:bg-black border-t border-gray-100 dark:border-gray-800 pt-16 pb-8 transition-colors duration-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                    {/* Brand Info */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
                            FeetUp
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed">
                            Step into comfort and style with our premium collection of footwear. Designed for the modern lifestyle.
                        </p>
                        <div className="flex space-x-4">
                            <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                                <Facebook size={20} />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                                <Twitter size={20} />
                            </a>
                            <a href="#" className="text-gray-400 hover:text-primary-500 transition-colors">
                                <Instagram size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-6">Shop</h4>
                        <ul className="space-y-3">
                            <li><Link to="/men" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">Men's Shoes</Link></li>
                            <li><Link to="/women" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">Women's Shoes</Link></li>
                            <li><Link to="/sale" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">Sale</Link></li>
                            <li><Link to="/new" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">New Arrivals</Link></li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-6">Company</h4>
                        <ul className="space-y-3">
                            <li><Link to="/about" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">About Us</Link></li>
                            <li><Link to="/contact" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">Contact Us</Link></li>
                            <li><Link to="/privacy" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">Privacy Policy</Link></li>
                            <li><Link to="/terms" className="text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 text-sm">Terms of Service</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="font-semibold text-gray-900 dark:text-white mb-6">Contact</h4>
                        <ul className="space-y-3">
                            <li className="flex items-start space-x-3 text-gray-500 dark:text-gray-400 text-sm">
                                <MapPin size={18} className="mt-0.5 flex-shrink-0" />
                                <span>123 Shoe Lane, Fashion City, FC 12345</span>
                            </li>
                            <li className="flex items-center space-x-3 text-gray-500 dark:text-gray-400 text-sm">
                                <Phone size={18} className="flex-shrink-0" />
                                <span>+1 (234) 567-890</span>
                            </li>
                            <li className="flex items-center space-x-3 text-gray-500 dark:text-gray-400 text-sm">
                                <Mail size={18} className="flex-shrink-0" />
                                <span>support@feetup.com</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-800 pt-8 text-center text-sm text-gray-400">
                    <p>&copy; {new Date().getFullYear()} FeetUp. All rights reserved.</p>
                    <p className="mt-2 text-xs">Design & Develop by <span className="text-primary-600 dark:text-primary-400 font-semibold">51088</span></p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
