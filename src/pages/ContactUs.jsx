import { MapPin, Phone, Mail } from 'lucide-react';
import Reveal from '../components/Reveal';

const ContactUs = () => {
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <Reveal>
                <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-8">Contact Us</h1>
            </Reveal>

            <Reveal delay={0.2} className="grid grid-cols-1 md:grid-cols-2 gap-12">
                {/* Contact Info */}
                <div className="space-y-8">
                    <p className="text-lg text-gray-600 dark:text-gray-300">
                        Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                    </p>

                    <div className="space-y-6">
                        <div className="flex items-center space-x-4">
                            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
                                <MapPin className="text-primary-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Our Location</h3>
                                <p className="text-gray-600 dark:text-gray-400">123 Shoe Lane, Fashion City</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
                                <Phone className="text-primary-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Phone Number</h3>
                                <p className="text-gray-600 dark:text-gray-400">+1 (234) 567-890</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-4">
                            <div className="bg-primary-100 dark:bg-primary-900/30 p-3 rounded-full">
                                <Mail className="text-primary-600" size={24} />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Email Address</h3>
                                <p className="text-gray-600 dark:text-gray-400">support@feetup.com</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Map Placeholder */}
                <div className="h-96 bg-gray-200 dark:bg-gray-800 rounded-lg overflow-hidden relative">
                    <iframe
                        src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3024.2219901290355!2d-74.00369368400567!3d40.71312937933185!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x89c25a23e28c1191%3A0x49f75d3281df052a!2s150%20Park%20Row%2C%20New%20York%2C%20NY%2010007!5e0!3m2!1sen!2sus!4v1644262070010!5m2!1sen!2sus"
                        width="100%"
                        height="100%"
                        style={{ border: 0 }}
                        allowFullScreen=""
                        loading="lazy"
                        title="Google Maps"
                    ></iframe>
                </div>
            </Reveal>
        </div>
    );
};

export default ContactUs;
