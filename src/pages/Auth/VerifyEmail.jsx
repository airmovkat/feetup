import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import { useAuth } from '../../components/AuthContext';

const VerifyEmail = () => {
    const [code, setCode] = useState(['', '', '', '']);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [resendMessage, setResendMessage] = useState('');
    const { verifyEmail, user, resendVerificationEmail, logout } = useAuth();
    const navigate = useNavigate();

    const handleResend = async () => {
        setResendLoading(true);
        setResendMessage('');
        setError('');

        const result = await resendVerificationEmail();

        setResendLoading(false);
        if (result && result.success) {
            setResendMessage('Verification code resent! Check your inbox.');
        } else {
            setError('Failed to resend code. Please try again.');
        }
    };

    useEffect(() => {
        if (success) return; // Don't auto-redirect if success message is showing
        if (!user) {
            navigate('/signup');
        } else if (user.isVerified) {
            navigate('/');
        }
    }, [user, navigate, success]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;
        const newCode = [...code];
        newCode[index] = value.substring(value.length - 1);
        setCode(newCode);

        // Auto-focus next input
        if (value && index < 3) {
            document.getElementById(`code-${index + 1}`).focus();
        }
    };

    const handleVerify = async () => {
        const fullCode = code.join('');
        // Verify and update local state immediately
        const result = await verifyEmail(user?.email, fullCode); // Explicitly pass email from user object

        if (result.success) {
            // Verify successful
            setSuccess(true);
            setTimeout(() => {
                navigate('/');
            }, 2000);
        } else {
            setError(result.message || 'Invalid verification code. Please check your email.');
        }
    };

    if (success) {
        return (
            <div className="min-h-[80vh] flex items-center justify-center px-4">
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="max-w-md w-full text-center bg-white dark:bg-gray-900 p-12 rounded-2xl shadow-xl border border-green-100 dark:border-green-900"
                >
                    <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Email Verified!</h1>
                    <p className="text-gray-500 dark:text-gray-400">Welcome to FeetUp, {user?.name}. Redirecting you to the shop...</p>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-xl p-8 border border-gray-100 dark:border-gray-800"
            >
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-4">
                        <Mail className="w-8 h-8 text-blue-600 dark:text-blue-500" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Verify Email</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">
                        We've sent a 4-digit code to <strong>{user?.email}</strong>
                    </p>
                </div>

                <div className="flex justify-center gap-4 mb-8">
                    {code.map((digit, index) => (
                        <input
                            key={index}
                            id={`code-${index}`}
                            type="text"
                            maxLength="1"
                            value={digit}
                            onChange={(e) => handleChange(index, e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Backspace' && !digit && index > 0) {
                                    document.getElementById(`code-${index - 1}`).focus();
                                }
                            }}
                            className="w-14 h-16 text-center text-2xl font-bold bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-primary-500 rounded-xl outline-none transition-all dark:text-white"
                        />
                    ))}
                </div>

                {error && (
                    <div className="flex items-center gap-2 text-red-500 text-sm justify-center mb-6">
                        <AlertCircle size={16} />
                        {error}
                    </div>
                )}

                <button
                    onClick={handleVerify}
                    className="w-full flex items-center justify-center py-4 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all shadow-lg"
                >
                    Verify & Continue
                    <ArrowRight className="ml-2 w-5 h-5" />
                </button>

                <div className="mt-8 text-center flex flex-col items-center">
                    <button
                        onClick={handleResend}
                        disabled={resendLoading}
                        className="text-gray-400 hover:text-primary-600 text-sm font-medium transition-colors disabled:opacity-50"
                    >
                        {resendLoading ? 'Sending...' : "Didn't receive the code? Resend"}
                    </button>
                    {resendMessage && <p className="text-green-500 text-sm mt-2">{resendMessage}</p>}
                </div>
            </motion.div>
        </div>
    );
};

export default VerifyEmail;
