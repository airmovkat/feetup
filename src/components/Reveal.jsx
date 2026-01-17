import React from 'react';
import { motion } from 'framer-motion';

const Reveal = ({ children, className = "", delay = 0.25 }) => {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 50 },
                visible: { opacity: 1, y: 0 },
            }}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, ease: "easeOut", delay }}
            className={className}
            style={{
                willChange: "opacity, transform",
                // Fix for possible text rendering jitter
                backfaceVisibility: "hidden",
                WebkitFontSmoothing: "antialiased"
            }}
        >
            {children}
        </motion.div>
    );
};

export default Reveal;
