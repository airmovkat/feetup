import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, X } from 'lucide-react';
import { useNotification } from './NotificationContext';

const Notification = () => {
    const { notifications, removeNotification } = useNotification();

    return (
        <div className="fixed top-24 right-6 z-[99999] flex flex-col gap-3 pointer-events-none">
            <AnimatePresence>
                {notifications.map((n) => (
                    <motion.div
                        key={n.id}
                        initial={{ opacity: 0, x: 100 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 100 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                        className="pointer-events-auto bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-2xl p-4 min-w-[300px] flex items-center justify-between group"
                    >
                        <div className="flex items-center gap-3">
                            <div className="bg-primary-100 dark:bg-primary-900/30 p-2 rounded-lg text-primary-600 dark:text-primary-500">
                                <CheckCircle size={20} />
                            </div>
                            <p className="text-gray-900 dark:text-white font-medium">{n.message}</p>
                        </div>
                        <button
                            onClick={() => removeNotification(n.id)}
                            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-1"
                        >
                            <X size={18} />
                        </button>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
};

export default Notification;
