import React from 'react';

interface ApexLogoProps {
  className?: string;
  iconSize?: number; // size in px for the icon, defaults to 44
  showTagline?: boolean;
  compactOnMobile?: boolean;
}

/**
 * ApexLogoMark - The official dark forest-green rounded-square logo icon
 * with the stylized white letter 'A' and two-tone leaf detail.
 * Exactly matches the Apex Retail Mart reference identity provided by the user.
 */
export const ApexLogoMark: React.FC<{ size?: number; className?: string }> = ({
  size = 44,
  className = ''
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        {/* Rich Forest-Green Squircle Background Gradient */}
        <linearGradient id="apexBgGrad" x1="20" y1="15" x2="185" y2="190" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0c563d" />
          <stop offset="45%" stopColor="#063e2a" />
          <stop offset="100%" stopColor="#022115" />
        </linearGradient>

        {/* Ambient Top Glow Highlight */}
        <radialGradient
          id="apexHighlight"
          cx="70"
          cy="45"
          r="110"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#22c55e" stopOpacity="0.28" />
          <stop offset="50%" stopColor="#15803d" stopOpacity="0.08" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Leaf Upper Blade Gradient (Vibrant Spring / Lime Green) */}
        <linearGradient id="leafUpperGrad" x1="82" y1="102" x2="152" y2="108" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#a7f3d0" />
          <stop offset="35%" stopColor="#4ade80" />
          <stop offset="100%" stopColor="#22c55e" />
        </linearGradient>

        {/* Leaf Lower Blade Gradient (Lush Deep Emerald) */}
        <linearGradient id="leafLowerGrad" x1="82" y1="120" x2="152" y2="116" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="55%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#14532d" />
        </linearGradient>

        {/* Subtle shadow behind the white 'A' */}
        <filter id="apexAshadow" x="-10%" y="-10%" width="125%" height="125%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0" dy="2.5" stdDeviation="2.5" floodColor="#01140d" floodOpacity="0.45" />
        </filter>

        {/* Shadow under the leaf */}
        <filter id="leafShadow" x="-15%" y="-15%" width="135%" height="135%" filterUnits="userSpaceOnUse">
          <feDropShadow dx="0.5" dy="1.5" stdDeviation="1.5" floodColor="#032115" floodOpacity="0.5" />
        </filter>
      </defs>

      {/* Rounded-square background (Squircle with smooth 46px corner radius) */}
      <rect
        x="0"
        y="0"
        width="200"
        height="200"
        rx="46"
        fill="url(#apexBgGrad)"
      />
      {/* Top subtle highlight shimmer */}
      <rect
        x="0"
        y="0"
        width="200"
        height="200"
        rx="46"
        fill="url(#apexHighlight)"
      />
      {/* Subtle crisp inner border */}
      <rect
        x="0.75"
        y="0.75"
        width="198.5"
        height="198.5"
        rx="45.25"
        stroke="#10b981"
        strokeWidth="1.5"
        strokeOpacity="0.18"
      />

      {/* White Stylized Letter 'A' */}
      <g filter="url(#apexAshadow)">
        <path
          d="M 89 36 
             L 111 36 
             L 162 164 
             L 132 164 
             L 118 132 
             L 82 132 
             L 68 164 
             L 38 164 
             Z
             M 100 72 
             L 113 108 
             L 87 108 
             Z"
          fill="#FFFFFF"
          fillRule="evenodd"
        />
      </g>

      {/* Leaf Detail (Sitting over the right crossbar area of the 'A') */}
      <g filter="url(#leafShadow)">
        {/* Leaf Dark Edge Outline */}
        <path
          d="M 83 127
             C 86 105, 114 95, 154 104
             C 142 127, 118 143, 83 127
             Z"
          fill="#063825"
          opacity="0.4"
        />

        {/* Upper Leaf Half */}
        <path
          d="M 83 127
             C 87 107, 115 96, 153 104
             C 126 115, 106 121, 83 127
             Z"
          fill="url(#leafUpperGrad)"
        />

        {/* Lower Leaf Half */}
        <path
          d="M 83 127
             C 106 121, 126 115, 153 104
             C 140 125, 116 138, 83 127
             Z"
          fill="url(#leafLowerGrad)"
        />

        {/* Central Leaf Vein */}
        <path
          d="M 84 127
             C 106 121, 126 115, 152 104"
          stroke="#0f5132"
          strokeWidth="1.75"
          strokeLinecap="round"
          fill="none"
        />

        {/* Subtle Leaf Spine Light Accent */}
        <path
          d="M 87 126
             C 107 120, 124 114, 147 105"
          stroke="#86efac"
          strokeWidth="0.85"
          strokeLinecap="round"
          fill="none"
          opacity="0.75"
        />
      </g>
    </svg>
  );
};

/**
 * ApexLogo - The complete primary brand logo for Apex Retail Mart.
 * Consists of:
 * 1. The dark forest-green rounded-square logo icon with the stylized white "A" and green leaf detail.
 * 2. "Apex Retail Mart" brand wordmark.
 * 3. "OFFICIAL RETAIL STORE" tagline.
 */
export const ApexLogo: React.FC<ApexLogoProps> = ({
  className = '',
  iconSize = 44,
  showTagline = true,
  compactOnMobile = true
}) => {
  return (
    <div className={`flex items-center gap-2.5 sm:gap-3.5 select-none ${className}`}>
      {/* 1. Dark forest-green rounded-square logo icon */}
      <ApexLogoMark size={iconSize} className="shadow-xs group-hover:scale-[1.02] transition-transform" />

      {/* 2. Brand Name and Tagline */}
      <div className="flex flex-col text-left leading-none justify-center">
        {/* Brand Name: 'Apex Retail Mart' */}
        <div className="flex items-center gap-1 sm:gap-1.5 font-black tracking-tight">
          <span className="text-[#064e3b] text-base sm:text-[19px] md:text-[21px] font-extrabold tracking-tight">
            Apex
          </span>
          <span className="text-stone-900 text-base sm:text-[19px] md:text-[21px] font-black tracking-tight">
            Retail Mart
          </span>
        </div>

        {/* Tagline: 'OFFICIAL RETAIL STORE' */}
        {showTagline && (
          <span
            className={`text-[9px] sm:text-[10px] md:text-[10.5px] font-bold text-[#064e3b] uppercase tracking-[0.22em] sm:tracking-[0.26em] pt-1 sm:pt-1.5 block ${
              compactOnMobile ? 'hidden min-[420px]:block' : ''
            }`}
          >
            OFFICIAL RETAIL STORE
          </span>
        )}
      </div>
    </div>
  );
};
