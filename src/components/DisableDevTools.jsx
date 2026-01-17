import { useEffect } from 'react';

// This component attempts to disable common developer tools shortcuts and right-click
// Note: This is client-side only and not a perfect security measure.
const DisableDevTools = () => {
    useEffect(() => {
        const handleContextMenu = (e) => {
            e.preventDefault();
            return false;
        };

        const handleKeyDown = (e) => {
            // Prevent F12
            if (e.key === 'F12') {
                e.preventDefault();
                return false;
            }

            // Prevent Ctrl+Shift+J, Ctrl+Shift+C (DevTools shortcuts) - Ctrl+Shift+I allowed for dev
            if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j' || e.key === 'C' || e.key === 'c')) {
                e.preventDefault();
                return false;
            }

            // Prevent Ctrl+U (View Source)
            if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) {
                e.preventDefault();
                return false;
            }
        };

        document.addEventListener('contextmenu', handleContextMenu);
        document.addEventListener('keydown', handleKeyDown);

        return () => {
            document.removeEventListener('contextmenu', handleContextMenu);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    return null; // This component handles side effects only
};

export default DisableDevTools;
