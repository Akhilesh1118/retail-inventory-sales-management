import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Zap,
  Heart,
  ShoppingBag,
  Tag,
  Flame,
  Star
} from 'lucide-react';
import { HeroBanner } from '../types/index.ts';
import { api } from '../api/client.ts';

export interface HeroSlide {
  id: string;
  mode?: 'image-only' | 'custom';
  categoryKey: string; // Target category filter
  badgeText: string;
  badgeIcon: React.ReactNode;
  headline: string;
  description: string;
  ctaText: string;
  accentColor: string;
  tagColor: string;
  backgroundGradient: string;
  backgroundColor?: string;
  imageUrl?: string;
  renderIllustration?: () => React.ReactNode;
}

interface HeroCarouselProps {
  categories: string[];
  onSelectCategory: (category: string) => void;
  onScrollToCatalog: () => void;
}

// Icon helper for dynamic banners
const getBadgeIcon = (iconName: string): React.ReactNode => {
  switch (iconName) {
    case 'Zap':
      return <Zap className="w-3.5 h-3.5 text-emerald-400" />;
    case 'Heart':
      return <Heart className="w-3.5 h-3.5 text-amber-400" />;
    case 'ShieldCheck':
      return <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />;
    case 'ShoppingBag':
      return <ShoppingBag className="w-3.5 h-3.5 text-lime-400" />;
    case 'Tag':
      return <Tag className="w-3.5 h-3.5 text-rose-400" />;
    case 'Flame':
      return <Flame className="w-3.5 h-3.5 text-orange-400" />;
    case 'Star':
      return <Star className="w-3.5 h-3.5 text-yellow-400" />;
    default:
      return <Sparkles className="w-3.5 h-3.5 text-lime-400" />;
  }
};

// --- Vector Illustration Renderers ---

const renderEssentialsIllustration = () => (
  <svg viewBox="0 0 540 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
    <defs>
      <radialGradient id="glow-essentials" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#84cc16" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#064e3b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="bag-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#1e3a2f" />
        <stop offset="100%" stopColor="#0a2318" />
      </linearGradient>
      <linearGradient id="milk-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#cbd5e1" />
      </linearGradient>
      <linearGradient id="fruit-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
      <linearGradient id="apple-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ef4444" />
        <stop offset="100%" stopColor="#b91c1c" />
      </linearGradient>
    </defs>
    <circle cx="340" cy="170" r="150" fill="url(#glow-essentials)" />
    <path d="M190 130 C190 90, 290 90, 290 130" stroke="#a3e635" strokeWidth="8" strokeLinecap="round" fill="none" opacity="0.9" />
    <rect x="170" y="125" width="140" height="155" rx="16" fill="url(#bag-grad)" stroke="#10b981" strokeWidth="2" />
    <path d="M170 145 H310" stroke="#065f46" strokeWidth="2" strokeDasharray="4 4" />
    <circle cx="240" cy="195" r="28" fill="#042f20" stroke="#34d399" strokeWidth="2" />
    <path d="M232 195 L238 201 L249 190" stroke="#a3e635" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="330" y="110" width="60" height="150" rx="14" fill="url(#milk-grad)" stroke="#94a3b8" strokeWidth="2" />
    <rect x="345" y="85" width="30" height="25" rx="6" fill="#3b82f6" />
    <rect x="338" y="160" width="44" height="40" rx="6" fill="#0284c7" opacity="0.15" />
    <path d="M346 180 C352 175, 368 185, 374 180" stroke="#0284c7" strokeWidth="2" strokeLinecap="round" />
    <ellipse cx="280" cy="95" rx="18" ry="60" transform="rotate(25 280 95)" fill="#d97706" stroke="#b45309" strokeWidth="2" />
    <line x1="265" y1="80" x2="280" y2="70" stroke="#fef3c7" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="275" y1="100" x2="290" y2="90" stroke="#fef3c7" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="285" y1="120" x2="300" y2="110" stroke="#fef3c7" strokeWidth="2.5" strokeLinecap="round" />
    <circle cx="150" cy="235" r="34" fill="url(#fruit-grad)" stroke="#b45309" strokeWidth="2" />
    <circle cx="145" cy="225" r="3" fill="#fef3c7" opacity="0.6" />
    <path d="M150 201 Q155 195 165 198" stroke="#15803d" strokeWidth="3" strokeLinecap="round" fill="none" />
    <circle cx="205" cy="250" r="30" fill="url(#apple-grad)" stroke="#991b1b" strokeWidth="2" />
    <path d="M205 220 Q212 210 220 215" stroke="#15803d" strokeWidth="3" strokeLinecap="round" fill="none" />
    <g transform="translate(380, 210)">
      <rect width="120" height="52" rx="12" fill="#042017" stroke="#10b981" strokeWidth="1.5" />
      <circle cx="26" cy="26" r="14" fill="#064e3b" />
      <path d="M22 26 L25 29 L31 22" stroke="#a3e635" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <text x="48" y="22" fill="#ffffff" fontSize="10" fontWeight="700" fontFamily="sans-serif">100% FRESH</text>
      <text x="48" y="36" fill="#86efac" fontSize="9" fontFamily="sans-serif">Daily Restocked</text>
    </g>
  </svg>
);

const renderElectronicsIllustration = () => (
  <svg viewBox="0 0 540 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
    <defs>
      <radialGradient id="glow-tech" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="headphone-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#334155" />
        <stop offset="100%" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="gold-pin" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#d97706" />
      </linearGradient>
    </defs>
    <circle cx="340" cy="170" r="160" fill="url(#glow-tech)" />
    <path d="M140 180 H220 L240 150 L270 210 L290 180 H420" stroke="#10b981" strokeWidth="2" strokeDasharray="6 6" opacity="0.4" />
    <circle cx="240" cy="150" r="4" fill="#34d399" />
    <circle cx="270" cy="210" r="4" fill="#34d399" />
    <path d="M220 160 C220 90, 360 90, 360 160" stroke="#475569" strokeWidth="16" strokeLinecap="round" fill="none" />
    <path d="M225 155 C225 95, 355 95, 355 155" stroke="#10b981" strokeWidth="3" fill="none" opacity="0.8" />
    <rect x="200" y="150" width="38" height="65" rx="18" fill="url(#headphone-grad)" stroke="#34d399" strokeWidth="2.5" />
    <circle cx="219" cy="182" r="10" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
    <rect x="342" y="150" width="38" height="65" rx="18" fill="url(#headphone-grad)" stroke="#34d399" strokeWidth="2.5" />
    <circle cx="361" cy="182" r="10" fill="#0f172a" stroke="#64748b" strokeWidth="1.5" />
    <path d="M170 270 C240 230, 270 300, 340 260 S400 240, 430 270" stroke="#059669" strokeWidth="7" strokeLinecap="round" fill="none" />
    <rect x="150" y="258" width="32" height="18" rx="4" fill="#94a3b8" stroke="#475569" strokeWidth="1.5" />
    <rect x="140" y="262" width="12" height="10" rx="2" fill="url(#gold-pin)" />
    <rect x="375" y="120" width="90" height="155" rx="16" fill="#09131f" stroke="#334155" strokeWidth="3" />
    <rect x="382" y="130" width="76" height="125" rx="10" fill="#0f172a" />
    <circle cx="420" cy="140" r="3" fill="#64748b" />
    <line x1="400" y1="180" x2="440" y2="180" stroke="#10b981" strokeWidth="2" strokeLinecap="round" />
    <line x1="405" y1="190" x2="435" y2="190" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" opacity="0.6" />
    <g transform="translate(140, 95)">
      <rect width="115" height="42" rx="10" fill="#021c17" stroke="#10b981" strokeWidth="1.5" />
      <text x="14" y="18" fill="#34d399" fontSize="9" fontWeight="700" fontFamily="sans-serif">QC 3.0 & AUDIO</text>
      <text x="14" y="32" fill="#ffffff" fontSize="11" fontWeight="800" fontFamily="sans-serif">High-Speed Tech</text>
    </g>
  </svg>
);

const renderPantryIllustration = () => (
  <svg viewBox="0 0 540 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
    <defs>
      <radialGradient id="glow-pantry" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#1c130b" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="sack-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="jar-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0.05" />
      </linearGradient>
    </defs>
    <circle cx="340" cy="170" r="160" fill="url(#glow-pantry)" />
    <path d="M160 260 Q170 180 200 120" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" opacity="0.3" fill="none" />
    <ellipse cx="195" cy="125" rx="6" ry="12" transform="rotate(30 195 125)" fill="#f59e0b" opacity="0.4" />
    <ellipse cx="185" cy="145" rx="6" ry="12" transform="rotate(-30 185 145)" fill="#f59e0b" opacity="0.4" />
    <ellipse cx="180" cy="165" rx="6" ry="12" transform="rotate(30 180 165)" fill="#f59e0b" opacity="0.4" />
    <path d="M210 160 C210 145, 230 135, 265 135 C300 135, 320 145, 320 160 L335 250 C335 270, 310 280, 265 280 C220 280, 195 270, 195 250 Z" fill="url(#sack-grad)" stroke="#78350f" strokeWidth="3" />
    <ellipse cx="265" cy="148" rx="55" ry="14" fill="#fef3c7" stroke="#b45309" strokeWidth="2" />
    <circle cx="245" cy="148" r="2" fill="#d97706" />
    <circle cx="260" cy="146" r="2.5" fill="#d97706" />
    <circle cx="275" cy="150" r="2" fill="#d97706" />
    <circle cx="255" cy="151" r="2" fill="#b45309" />
    <rect x="230" y="195" width="70" height="36" rx="6" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
    <text x="242" y="212" fill="#92400e" fontSize="9" fontWeight="800" fontFamily="sans-serif">BASMATI</text>
    <text x="247" y="223" fill="#b45309" fontSize="8" fontWeight="600" fontFamily="sans-serif">5KG PACK</text>
    <rect x="345" y="140" width="75" height="120" rx="16" fill="url(#jar-grad)" stroke="#fcd34d" strokeWidth="2" />
    <rect x="355" y="125" width="55" height="18" rx="6" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
    <path d="M347 185 Q382 175 418 185 L418 245 C418 255 405 258 382 258 C360 258 347 255 347 245 Z" fill="#f59e0b" opacity="0.95" />
    <circle cx="365" cy="205" r="3" fill="#b45309" />
    <circle cx="380" cy="215" r="3.5" fill="#fef3c7" />
    <circle cx="395" cy="200" r="3" fill="#b45309" />
    <g transform="translate(130, 180)">
      <circle cx="30" cy="30" r="26" fill="#042017" stroke="#f59e0b" strokeWidth="2" />
      <path d="M30 14 L34 24 L45 24 L36 31 L40 42 L30 35 L20 42 L24 31 L15 24 L26 24 Z" fill="#f59e0b" />
      <text x="14" y="70" fill="#fef3c7" fontSize="10" fontWeight="700" fontFamily="sans-serif">100% PURE</text>
    </g>
  </svg>
);

const renderCleaningIllustration = () => (
  <svg viewBox="0 0 540 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
    <defs>
      <radialGradient id="glow-clean" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#042520" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="amber-bottle" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="towel-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#f0fdfa" />
        <stop offset="100%" stopColor="#ccfbf1" />
      </linearGradient>
    </defs>
    <circle cx="340" cy="170" r="160" fill="url(#glow-clean)" />
    <circle cx="180" cy="120" r="14" fill="#5eead4" opacity="0.3" stroke="#2dd4bf" strokeWidth="1" />
    <circle cx="176" cy="116" r="3" fill="#ffffff" opacity="0.8" />
    <circle cx="210" cy="95" r="8" fill="#5eead4" opacity="0.4" stroke="#2dd4bf" strokeWidth="1" />
    <circle cx="430" cy="140" r="18" fill="#5eead4" opacity="0.3" stroke="#2dd4bf" strokeWidth="1" />
    <circle cx="424" cy="134" r="4" fill="#ffffff" opacity="0.8" />
    <circle cx="450" cy="190" r="10" fill="#5eead4" opacity="0.4" stroke="#2dd4bf" strokeWidth="1" />
    <path d="M260 90 H285 V120 H250 Z" fill="#334155" />
    <path d="M285 96 L310 96 L305 108 L285 106 Z" fill="#64748b" />
    <path d="M255 105 L240 120" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
    <rect x="235" y="125" width="68" height="145" rx="20" fill="url(#amber-bottle)" stroke="#b45309" strokeWidth="2" />
    <rect x="245" y="160" width="48" height="55" rx="8" fill="#fef3c7" stroke="#d97706" strokeWidth="1" />
    <circle cx="269" cy="180" r="12" fill="#14b8a6" />
    <path d="M264 180 L268 184 L275 176" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <text x="250" y="205" fill="#78350f" fontSize="7" fontWeight="700" fontFamily="sans-serif">BIO-CLEAN</text>
    <rect x="320" y="215" width="115" height="26" rx="8" fill="url(#towel-grad)" stroke="#99f6e4" strokeWidth="1.5" />
    <rect x="325" y="185" width="105" height="26" rx="8" fill="#99f6e4" stroke="#5eead4" strokeWidth="1.5" />
    <rect x="330" y="155" width="95" height="26" rx="8" fill="#2dd4bf" stroke="#14b8a6" strokeWidth="1.5" />
    <path d="M375 155 Q400 110 395 75" stroke="#10b981" strokeWidth="3" strokeLinecap="round" fill="none" />
    <ellipse cx="388" cy="120" rx="10" ry="18" transform="rotate(-35 388 120)" fill="#34d399" />
    <ellipse cx="400" cy="95" rx="9" ry="16" transform="rotate(35 400 95)" fill="#6ee7b7" />
    <g transform="translate(140, 175)">
      <rect width="80" height="48" rx="10" fill="#022c24" stroke="#2dd4bf" strokeWidth="1.5" />
      <text x="12" y="22" fill="#2dd4bf" fontSize="8" fontWeight="800" fontFamily="sans-serif">ECO SAFE</text>
      <text x="12" y="38" fill="#ffffff" fontSize="11" fontWeight="700" fontFamily="sans-serif">Non-Toxic</text>
    </g>
  </svg>
);

const renderStoreIllustration = () => (
  <svg viewBox="0 0 540 340" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-2xl">
    <defs>
      <radialGradient id="glow-store" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#a3e635" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#032016" stopOpacity="0" />
      </radialGradient>
      <linearGradient id="box-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#0f766e" />
        <stop offset="100%" stopColor="#042f2e" />
      </linearGradient>
      <linearGradient id="ribbon-grad" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#bef264" />
        <stop offset="100%" stopColor="#84cc16" />
      </linearGradient>
    </defs>
    <circle cx="340" cy="170" r="160" fill="url(#glow-store)" />
    <rect x="220" y="140" width="170" height="130" rx="16" fill="url(#box-grad)" stroke="#14b8a6" strokeWidth="2.5" />
    <rect x="290" y="140" width="30" height="130" fill="url(#ribbon-grad)" />
    <rect x="220" y="195" width="170" height="20" fill="url(#ribbon-grad)" />
    <ellipse cx="285" cy="130" rx="22" ry="14" transform="rotate(-25 285 130)" fill="#bef264" stroke="#65a30d" strokeWidth="2" />
    <ellipse cx="325" cy="130" rx="22" ry="14" transform="rotate(25 325 130)" fill="#bef264" stroke="#65a30d" strokeWidth="2" />
    <circle cx="305" cy="135" r="9" fill="#84cc16" />
    <g transform="translate(150, 110)">
      <rect width="90" height="120" rx="8" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
      <path d="M10 15 H80 M10 25 H55 M10 40 H75 M10 50 H65 M10 65 H80 M10 80 H70" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />
      <rect x="10" y="95" width="70" height="15" rx="4" fill="#064e3b" />
      <text x="24" y="106" fill="#a3e635" fontSize="8" fontWeight="800" fontFamily="sans-serif">PAID GST</text>
    </g>
    <path d="M380 230 L395 230 L415 170 H465" stroke="#a3e635" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
    <circle cx="415" cy="245" r="7" fill="#a3e635" />
    <circle cx="455" cy="245" r="7" fill="#a3e635" />
    <g transform="translate(370, 90)">
      <rect width="130" height="42" rx="12" fill="#042017" stroke="#a3e635" strokeWidth="1.5" />
      <text x="14" y="18" fill="#a3e635" fontSize="9" fontWeight="700" fontFamily="sans-serif">GENUINE INVENTORY</text>
      <text x="14" y="32" fill="#ffffff" fontSize="11" fontWeight="800" fontFamily="sans-serif">Direct From Stores</text>
    </g>
  </svg>
);

const getIllustrationForBanner = (categoryKey: string, id: string) => {
  const cat = (categoryKey || '').toLowerCase();
  const lowerId = (id || '').toLowerCase();

  if (cat.includes('elect') || lowerId.includes('elect')) {
    return renderElectronicsIllustration;
  }
  if (cat.includes('groc') || cat.includes('staple') || lowerId.includes('groc')) {
    return renderPantryIllustration;
  }
  if (cat.includes('clean') || cat.includes('house') || lowerId.includes('clean')) {
    return renderCleaningIllustration;
  }
  if (cat === 'all' && (lowerId.includes('discover') || lowerId.includes('store') || lowerId.includes('5'))) {
    return renderStoreIllustration;
  }
  return renderEssentialsIllustration;
};

// 5 Hardcoded starter fallbacks in case network is down
const DEFAULT_FALLBACK_SLIDES: HeroSlide[] = [
  {
    id: 'everyday-essentials',
    categoryKey: 'all',
    badgeText: 'Curated Daily Retail',
    badgeIcon: <Sparkles className="w-3.5 h-3.5 text-lime-400" />,
    headline: 'Everything You Need, Every Day',
    description:
      'Discover everyday essentials for your home and pantry with instant store pickup, real-time stock availability, and guaranteed authentic inventory.',
    ctaText: 'Shop All Products',
    accentColor: '#a3e635',
    tagColor: 'bg-emerald-950/80 text-lime-300 border-emerald-700/60',
    backgroundGradient: 'from-[#032419] via-[#053827] to-[#074732]',
    renderIllustration: renderEssentialsIllustration
  },
  {
    id: 'electronics-accessories',
    categoryKey: 'Electronics & Accessories',
    badgeText: 'Electronics & Tech Accessories',
    badgeIcon: <Zap className="w-3.5 h-3.5 text-emerald-400" />,
    headline: 'Upgrade Your Everyday',
    description:
      'Explore dependable tech essentials, high-speed nylon-braided cables, premium audio accessories, and reliable electronics with warranty protection.',
    ctaText: 'Explore Electronics',
    accentColor: '#34d399',
    tagColor: 'bg-slate-900/90 text-emerald-300 border-emerald-600/50',
    backgroundGradient: 'from-[#0a1526] via-[#0f2438] to-[#07362a]',
    renderIllustration: renderElectronicsIllustration
  },
  {
    id: 'grocery-staples',
    categoryKey: 'Grocery & Staples',
    badgeText: 'Pantry & Authentic Kitchen Staples',
    badgeIcon: <Heart className="w-3.5 h-3.5 text-amber-400" />,
    headline: 'Your Everyday Pantry, Sorted',
    description:
      'Aged aromatic basmati rice, protein-rich lentils, cold-pressed oils, and farm-fresh spices handpicked for authentic daily family meals.',
    ctaText: 'Shop Groceries',
    accentColor: '#f59e0b',
    tagColor: 'bg-amber-950/70 text-amber-300 border-amber-600/50',
    backgroundGradient: 'from-[#1c130b] via-[#2d1e11] to-[#0d3024]',
    renderIllustration: renderPantryIllustration
  },
  {
    id: 'household-cleaning',
    categoryKey: 'Household & Cleaning',
    badgeText: 'Home Care & Sparkling Spaces',
    badgeIcon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
    headline: 'A Better Home Starts Here',
    description:
      'Eco-friendly surface cleaners, powerful laundry detergents, bio-enzyme dishwashing solutions, and premium household essentials for a sparkling clean home.',
    ctaText: 'Explore Home Essentials',
    accentColor: '#2dd4bf',
    tagColor: 'bg-teal-950/80 text-teal-300 border-teal-600/50',
    backgroundGradient: 'from-[#032520] via-[#083a32] to-[#04281f]',
    renderIllustration: renderCleaningIllustration
  },
  {
    id: 'discover-more',
    categoryKey: 'all',
    badgeText: 'Apex Retail Mart Verified Catalog',
    badgeIcon: <ShoppingBag className="w-3.5 h-3.5 text-lime-400" />,
    headline: 'Find Your Everyday Favorites',
    description:
      'Browse our complete retail collection of grocery, beverages, snacks, chilled dairy, and home goods with authoritative GST invoicing and click-and-collect.',
    ctaText: 'Explore the Store',
    accentColor: '#a3e635',
    tagColor: 'bg-emerald-950/80 text-lime-300 border-lime-500/50',
    backgroundGradient: 'from-[#032016] via-[#063827] to-[#0a4834]',
    renderIllustration: renderStoreIllustration
  }
];

export const HeroCarousel: React.FC<HeroCarouselProps> = ({
  categories,
  onSelectCategory,
  onScrollToCatalog
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchDeltaX, setTouchDeltaX] = useState<number>(0);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [dynamicBanners, setDynamicBanners] = useState<HeroBanner[]>([]);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch active promotional banners from the backend API
  useEffect(() => {
    let isMounted = true;
    api.getBanners(false)
      .then((res) => {
        if (isMounted && res.banners && res.banners.length > 0) {
          setDynamicBanners(res.banners);
        }
      })
      .catch((err) => {
        console.warn('Could not fetch dynamic banners, falling back to starter templates:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  // Check user preference for reduced motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  // Compute slides dynamically from backend banners or fallback to starter templates
  const slides: HeroSlide[] = useMemo(() => {
    if (dynamicBanners.length > 0) {
      return dynamicBanners.map((b) => ({
        id: b._id,
        mode: b.mode || (b.imageUrl && (!b.description || b.description === '') && (!b.badgeText || b.badgeText === '') ? 'image-only' : 'custom'),
        categoryKey: b.categoryKey || 'all',
        badgeText: b.badgeText || '',
        badgeIcon: getBadgeIcon(b.badgeIcon || 'Sparkles'),
        headline: b.title || 'Promotional Banner',
        description: b.description || '',
        ctaText: b.ctaText || 'Shop Now',
        accentColor: b.accentColor || '#a3e635',
        tagColor: 'bg-emerald-950/80 text-lime-300 border-emerald-700/60',
        backgroundGradient: b.backgroundGradient || 'from-[#032419] via-[#053827] to-[#074732]',
        backgroundColor: b.backgroundColor || '#021811',
        imageUrl: b.imageUrl,
        renderIllustration: getIllustrationForBanner(b.categoryKey || 'all', b._id)
      }));
    }
    return DEFAULT_FALLBACK_SLIDES;
  }, [dynamicBanners]);

  const totalSlides = slides.length;

  // Keep currentSlide within bounds if totalSlides changes
  useEffect(() => {
    if (currentSlide >= totalSlides && totalSlides > 0) {
      setCurrentSlide(0);
    }
  }, [totalSlides, currentSlide]);

  const goToNext = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  }, [totalSlides]);

  const goToPrev = useCallback(() => {
    if (totalSlides === 0) return;
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  }, [totalSlides]);

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Autoplay management (3.5 seconds = 3500ms)
  useEffect(() => {
    if (isHovered || prefersReducedMotion || totalSlides <= 1) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (timerRef.current) clearInterval(timerRef.current);
      } else {
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(goToNext, 3500);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    timerRef.current = setInterval(goToNext, 3500);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isHovered, prefersReducedMotion, goToNext, totalSlides]);

  // Touch Swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchDeltaX(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX !== null) {
      setTouchDeltaX(e.touches[0].clientX - touchStartX);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartX === null) return;
    const threshold = 45; // Min px swipe
    if (touchDeltaX < -threshold) {
      goToNext();
    } else if (touchDeltaX > threshold) {
      goToPrev();
    }
    setTouchStartX(null);
    setTouchDeltaX(0);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      goToPrev();
    } else if (e.key === 'ArrowRight') {
      goToNext();
    }
  };

  const handleCtaClick = (categoryKey: string) => {
    if (categoryKey === 'all') {
      onSelectCategory('all');
    } else {
      // Check if category exists in available categories
      const exists = categories.some((c) => c.toLowerCase() === categoryKey.toLowerCase());
      if (exists) {
        onSelectCategory(categoryKey);
      } else {
        onSelectCategory('all');
      }
    }
    onScrollToCatalog();
  };

  if (totalSlides === 0) {
    return null;
  }

  return (
    <section
      className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-5"
      aria-roledescription="carousel"
      aria-label="Promotional Campaigns Carousel"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="region"
    >
      <div
        className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-stone-800/40 shadow-xl bg-stone-950 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-lime-400 group"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Slides Track */}
        <div
          className={`flex w-full transition-transform ease-out ${
            prefersReducedMotion ? 'duration-0' : 'duration-500'
          }`}
          style={{ transform: `translateX(-${currentSlide * 100}%)` }}
        >
          {slides.map((slide, idx) => {
            const isImageOnly = slide.mode === 'image-only' && Boolean(slide.imageUrl);

            if (isImageOnly) {
              return (
                <div
                  key={slide.id}
                  className="w-full shrink-0 relative overflow-hidden min-h-[280px] sm:min-h-[360px] md:min-h-[400px] lg:min-h-[440px] max-h-[520px] flex items-center justify-center cursor-pointer select-none"
                  style={{ backgroundColor: slide.backgroundColor || '#021811' }}
                  aria-hidden={currentSlide !== idx}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`${slide.headline || 'Promotional Banner'} (${idx + 1} of ${totalSlides})`}
                  onClick={() => handleCtaClick(slide.categoryKey || 'all')}
                >
                  <img
                    src={slide.imageUrl}
                    alt={slide.headline || 'Promotional Banner'}
                    className="w-full h-full max-h-[520px] object-contain object-center transition-opacity duration-300"
                    loading={idx === 0 ? 'eager' : 'lazy'}
                  />
                </div>
              );
            }

            return (
              <div
                key={slide.id}
                className={`w-full shrink-0 relative bg-gradient-to-r ${slide.backgroundGradient} overflow-hidden min-h-[360px] sm:min-h-[380px] lg:min-h-[400px] flex items-center`}
                aria-hidden={currentSlide !== idx}
                role="group"
                aria-roledescription="slide"
                aria-label={`${slide.headline} (${idx + 1} of ${totalSlides})`}
              >
                {/* Subtle ambient lighting */}
                <div
                  className="absolute top-0 right-1/4 w-96 h-96 rounded-full blur-3xl pointer-events-none opacity-20"
                  style={{ backgroundColor: slide.accentColor }}
                />
                <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full blur-3xl pointer-events-none opacity-25 bg-[#064e3b]" />

                {/* Slide Content Grid: 12 Columns */}
                <div className="w-full max-w-7xl mx-auto px-6 sm:px-10 lg:px-14 py-8 sm:py-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
                  {/* Left 7 Columns: Editorial Copy & Working CTA */}
                  <div className="lg:col-span-7 space-y-3.5 sm:space-y-4 text-center lg:text-left">
                    {/* Clean category kicker / badge */}
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/20 text-xs font-semibold backdrop-blur-xs tracking-wide bg-black/40">
                      {slide.badgeIcon}
                      <span className="text-stone-200">{slide.badgeText}</span>
                    </div>

                    <h2 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight sm:leading-tight">
                      {slide.headline}
                    </h2>

                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed max-w-xl mx-auto lg:mx-0">
                      {slide.description}
                    </p>

                    {/* Optional mobile image if uploaded */}
                    {slide.imageUrl && (
                      <div className="lg:hidden w-full max-w-xs mx-auto my-2 aspect-video rounded-xl overflow-hidden border border-white/20 shadow-lg bg-black/40">
                        <img
                          src={slide.imageUrl}
                          alt={slide.headline}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    {/* Primary CTA Button */}
                    <div className="pt-2 sm:pt-3 flex flex-wrap items-center justify-center lg:justify-start gap-3">
                      <button
                        type="button"
                        onClick={() => handleCtaClick(slide.categoryKey)}
                        className="inline-flex items-center gap-2.5 px-6 py-3 font-extrabold text-xs sm:text-sm rounded-xl transition-all shadow-md active:scale-95 cursor-pointer group/btn"
                        style={{
                          backgroundColor: slide.accentColor || '#a3e635',
                          color: '#09090b'
                        }}
                      >
                        <span>{slide.ctaText}</span>
                        <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" />
                      </button>

                      <button
                        type="button"
                        onClick={onScrollToCatalog}
                        className="inline-flex items-center gap-2 px-4 py-3 bg-black/30 hover:bg-black/50 border border-white/15 text-stone-200 hover:text-white font-semibold text-xs sm:text-sm rounded-xl transition-colors backdrop-blur-xs cursor-pointer"
                      >
                        <span>Browse Full Catalog</span>
                      </button>
                    </div>
                  </div>

                  {/* Right 5 Columns: Uploaded Cloudinary Image OR Bespoke Vector Illustration */}
                  <div className="hidden lg:flex lg:col-span-5 items-center justify-center relative max-h-[320px]">
                    {slide.imageUrl ? (
                      <div className="relative w-full max-w-[420px] aspect-[4/3] rounded-2xl overflow-hidden border border-white/20 shadow-2xl bg-black/40 backdrop-blur-xs group/img">
                        <img
                          src={slide.imageUrl}
                          alt={slide.headline}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-105"
                          loading="lazy"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center pointer-events-none">
                        {slide.renderIllustration ? slide.renderIllustration() : renderEssentialsIllustration()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Carousel Arrow Controls (Previous / Next) */}
        {totalSlides > 1 && (
          <>
            <button
              type="button"
              onClick={goToPrev}
              aria-label="Previous slide"
              className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white border border-white/20 flex items-center justify-center shadow-lg transition-all backdrop-blur-xs opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 z-20 cursor-pointer"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={goToNext}
              aria-label="Next slide"
              className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-stone-900/70 hover:bg-stone-900 text-white border border-white/20 flex items-center justify-center shadow-lg transition-all backdrop-blur-xs opacity-80 group-hover:opacity-100 hover:scale-105 active:scale-95 z-20 cursor-pointer"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Indicator Pagination Dots */}
        {totalSlides > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20 bg-stone-950/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
            {slides.map((s, dotIdx) => (
              <button
                key={s.id}
                onClick={() => goToSlide(dotIdx)}
                aria-label={`Go to slide ${dotIdx + 1}: ${s.headline}`}
                aria-current={currentSlide === dotIdx ? 'true' : 'false'}
                className={`transition-all rounded-full cursor-pointer ${
                  currentSlide === dotIdx
                    ? 'w-6 h-2 bg-lime-400 shadow-xs'
                    : 'w-2 h-2 bg-white/40 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}

        {/* Autoplay Pause Indicator */}
        {isHovered && totalSlides > 1 && (
          <div className="absolute top-3 right-3 text-[10px] font-mono text-stone-300 bg-black/60 backdrop-blur-md px-2 py-0.5 rounded-md border border-white/10 z-20 pointer-events-none">
            Paused
          </div>
        )}
      </div>
    </section>
  );
};
