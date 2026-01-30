import React from 'react';
import { motion, HTMLMotionProps, Variants } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * 1. The Soft Lift (Hover)
 * Elevates the content with a slow, smooth shadow and scale.
 */
export const SoftLift: React.FC<HTMLMotionProps<"div">> = ({ children, className, ...props }) => (
    <motion.div
        whileHover={{ y: -4, scale: 1.01, transition: { duration: 0.3, ease: "easeOut" } }}
        className={cn("transition-shadow duration-300 hover:shadow-xl", className)}
        {...props}
    >
        {children}
    </motion.div>
);

/**
 * 2. Blur Reveal (Load)
 * Content fades in while un-blurring.
 */
export const BlurReveal: React.FC<HTMLMotionProps<"div"> & { delay?: number }> = ({
    children, className, delay = 0, ...props
}) => (
    <motion.div
        initial={{ opacity: 0, filter: 'blur(10px)', y: 10 }}
        animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
        transition={{ duration: 0.8, delay, ease: "easeOut" }}
        className={className}
        {...props}
    >
        {children}
    </motion.div>
);

/**
 * 3. Elastic Button (Click)
 * Tactile, squishy feedback on interaction.
 */
export const ElasticButton: React.FC<HTMLMotionProps<"button">> = ({ children, className, ...props }) => (
    <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        transition={{ type: "spring", stiffness: 400, damping: 15 }}
        className={cn("active:opacity-80", className)}
        {...props}
    >
        {children}
    </motion.button>
);

/**
 * 11. Staggered Slide-Up (List)
 * Orchestrated entry for list items.
 */
const staggeredListVariants: Variants = {
    hidden: { opacity: 0 },
    show: {
        opacity: 1,
        transition: {
            staggerChildren: 0.05,
            delayChildren: 0.1,
        }
    }
};

const staggeredItemVariants: Variants = {
    hidden: { opacity: 0, y: 20, filter: 'blur(4px)' },
    show: { opacity: 1, y: 0, filter: 'blur(0px)', transition: { duration: 0.5, ease: "easeOut" } }
};

export const StaggerList: React.FC<HTMLMotionProps<"div">> = ({ children, className, ...props }) => (
    <motion.div
        variants={staggeredListVariants}
        initial="hidden"
        animate="show"
        className={className}
        {...props}
    >
        {children}
    </motion.div>
);

export const StaggerItem: React.FC<HTMLMotionProps<"div">> = ({ children, className, ...props }) => (
    <motion.div
        variants={staggeredItemVariants}
        className={className}
        {...props}
    >
        {children}
    </motion.div>
);

/**
 * 14. Number Count-Up (Data)
 * Smoothly animates a number from 0 to value.
 */
export const CountUp: React.FC<{
    value: number;
    duration?: number;
    decimals?: number;
    prefix?: string;
    suffix?: string;
    className?: string;
    formatter?: (val: number) => string;
}> = ({
    value, duration = 2, decimals = 0, prefix = "", suffix = "", className, formatter
}) => {
        const [displayValue, setDisplayValue] = React.useState(0);

        React.useEffect(() => {
            let start = 0;
            const end = value;
            if (start === end) {
                setDisplayValue(end);
                return;
            }

            const totalMiliseconds = duration * 1000;
            const incrementTime = 16; // ~60fps
            const steps = totalMiliseconds / incrementTime;
            const increment = end / steps;

            const timer = setInterval(() => {
                start += increment;
                if ((increment > 0 && start >= end) || (increment < 0 && start <= end)) {
                    setDisplayValue(end);
                    clearInterval(timer);
                } else {
                    setDisplayValue(start);
                }
            }, incrementTime);

            return () => clearInterval(timer);
        }, [value, duration]);

        return (
            <span className={className}>
                {prefix}
                {formatter ? formatter(displayValue) : displayValue.toLocaleString(undefined, {
                    minimumFractionDigits: decimals,
                    maximumFractionDigits: decimals
                })}
                {suffix}
            </span>
        );
    };

/**
 * 12. Glass Sheet Wrapper
 * Adds a premium frosty blur background.
 */
export const GlassWrapper: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
    <div
        className={cn(
            "backdrop-blur-md bg-white/10 dark:bg-black/20 border border-white/20 dark:border-white/10 rounded-2xl",
            className
        )}
        {...props}
    >
        {children}
    </div>
);
