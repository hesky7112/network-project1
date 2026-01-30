import React from 'react';
import { AlienLogoSvg } from './alien-logo-svg';
import { cn } from '@/lib/utils';

interface LogoProps {
    className?: string;
    variant?: 'sidebar' | 'auth';
    showText?: boolean;
}

export const Logo: React.FC<LogoProps> = ({
    className,
    variant = 'sidebar',
    showText = true
}) => {
    const isAuth = variant === 'auth';

    return (
        <div className={cn("flex items-center", isAuth ? "flex-col space-y-4" : "space-x-3", className)}>
            <div
                className={cn(
                    "bg-gradient-to-br from-cosmic-red to-orange-500 flex items-center justify-center shadow-[0_0_20px_rgba(255,77,0,0.3)]",
                    isAuth ? "w-20 h-20" : "w-8 h-8 sm:w-10 sm:h-10"
                )}
                style={{ borderRadius: '2px' }}
            >
                <AlienLogoSvg
                    className={cn(
                        "text-black",
                        isAuth ? "h-14 w-14" : "h-7 w-7 sm:h-9 sm:w-9"
                    )}
                />
            </div>

            {showText && (
                <div className={cn(isAuth ? "text-center" : "text-left")}>
                    <h1
                        className={cn(
                            "font-black text-white uppercase tracking-tighter leading-none",
                            isAuth ? "text-3xl sm:text-4xl" : "text-sm sm:text-lg"
                        )}
                    >
                        Alien Net
                    </h1>
                    <p
                        className={cn(
                            "font-bold text-slate-600 uppercase tracking-[0.3em] leading-none mt-1",
                            isAuth ? "text-[10px]" : "text-[9px]"
                        )}
                    >
                        Enterprise Standard
                    </p>
                </div>
            )}
        </div>
    );
};

export default Logo;
