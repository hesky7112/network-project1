import React from 'react';

export const AlienLogoSvg: React.FC<{ className?: string }> = ({ className }) => (
    <svg
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
    >
        {/* Hoodie Silhouette */}
        <path
            d="M50 10C35 10 20 20 15 40C12 55 15 75 25 85L20 95H80L75 85C85 75 88 55 85 40C80 20 65 10 50 10Z"
            fill="currentColor"
            fillOpacity="0.8"
        />
        {/* Face Shape */}
        <path
            d="M50 20C38 20 28 32 28 50C28 65 38 75 50 75C62 75 72 65 72 50C72 32 62 20 50 20Z"
            fill="currentColor"
        />
        {/* Eyes */}
        <ellipse
            cx="40" cy="50" rx="8" ry="12"
            transform="rotate(-15 40 50)"
            fill="black"
        />
        <ellipse
            cx="60" cy="50" rx="8" ry="12"
            transform="rotate(15 60 50)"
            fill="black"
        />
        {/* Hoodie Details (strings) */}
        <rect x="42" y="78" width="2" height="12" rx="1" fill="black" fillOpacity="0.4" />
        <rect x="56" y="78" width="2" height="12" rx="1" fill="black" fillOpacity="0.4" />
    </svg>
);

export default AlienLogoSvg;
