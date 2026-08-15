import React from 'react';

export default function AppLogo({ size = 24, className = '', color = 'currentColor' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Connecting Stem & Fork Lines */}
      <path
        d="M8.8 12H12.5L16.2 7.8M12.5 12L16.2 16.2"
        stroke={color}
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 3 Circular Network Nodes */}
      <circle cx="5.8" cy="12" r="3.4" fill={color} />
      <circle cx="18.2" cy="5.8" r="3.4" fill={color} />
      <circle cx="18.2" cy="18.2" r="3.4" fill={color} />
    </svg>
  );
}
