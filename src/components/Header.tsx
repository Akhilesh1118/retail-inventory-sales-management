import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  Receipt,
  BarChart3,
  Layers,
  Settings,
  Store,
  ChevronDown,
  Menu,
  X,
  ShieldCheck,
  CheckCircle2,
  LogOut
} from 'lucide-react';

export type ActiveTab =
  | 'dashboard'
  | 'pos'
  | 'products'
  | 'inventory'
  | 'sales'
  | 'reports'
  | 'banners'
  | 'settings';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onSwitchToCustomerStore?: () => void;
}

interface NavItem {
  id: ActiveTab;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'pos', label: 'POS', icon: ShoppingCart },
  { id: 'products', label: 'Products', icon: Package },
  { id: 'inventory', label: 'Inventory', icon: Warehouse },
  { id: 'sales', label: 'Sales', icon: Receipt },
  { id: 'reports', label: 'Reports', icon: BarChart3 },
  { id: 'banners', label: 'Banners', icon: Layers, adminOnly: true },
  { id: 'settings', label: 'Settings', icon: Settings, adminOnly: true }
];

export const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab, onSwitchToCustomerStore }) => {
  const { user, logout, isAdmin } = useAuth();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const userMenuRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  // Filter navigation items based on actual permissions
  const visibleNavItems = NAV_ITEMS.filter((item) => !item.adminOnly || isAdmin);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (userMenuRef.current && !userMenuRef.current.contains(target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle keyboard Escape to dismiss dropdowns/drawers
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Auto-close mobile drawer when viewport reaches desktop breakpoint (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent background scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Compute clean user initials
  const initials = user?.fullName
    ? user.fullName
        .split(' ')
        .map((part) => part[0])
        .filter(Boolean)
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || 'OP';

  const roleLabel = user?.role === 'admin' ? 'Store Manager (Admin)' : 'Cashier (Staff)';
  const shortRoleLabel = user?.role === 'admin' ? 'Admin' : 'Staff';

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMobileMenuOpen(false);
    setIsUserMenuOpen(false);
  };

  const handleSignOut = () => {
    setIsUserMenuOpen(false);
    setIsMobileMenuOpen(false);
    logout();
    if (onSwitchToCustomerStore) {
      onSwitchToCustomerStore();
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-stone-200 shadow-2xs">
      <div className="w-full max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-[74px] gap-2 sm:gap-4 lg:gap-6 min-w-0">
          {/* ========================================================= */}
          {/* 1. LEFT SECTION: RF Logo, Brand & Subtitle                */}
          {/* ========================================================= */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              type="button"
              onClick={() => handleSelectTab('dashboard')}
              className="flex items-center gap-2.5 sm:gap-3 text-left group focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#064e3b] rounded-xl p-1 -m-1 transition-opacity hover:opacity-90 cursor-pointer"
              aria-label="RetailFlow Operations Dashboard"
            >
              <div className="w-10 h-10 sm:w-[42px] sm:h-[42px] rounded-xl bg-[#064e3b] text-white flex items-center justify-center font-extrabold text-sm sm:text-base shadow-xs border border-emerald-700/40 shrink-0">
                RF
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-extrabold text-lg sm:text-[20px] tracking-tight text-stone-900 block whitespace-nowrap">
                  RetailFlow
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 tracking-wider uppercase block whitespace-nowrap">
                  Retail Operations
                </span>
              </div>
            </button>
          </div>

          {/* ========================================================= */}
          {/* 2. CENTER SECTION: Stable Navigation (8 Modules)          */}
          {/* ========================================================= */}
          <nav
            aria-label="Management Portal Navigation"
            className="hidden lg:flex items-center justify-center flex-1 min-w-0 px-2"
          >
            <div className="flex items-center gap-1 xl:gap-1.5 2xl:gap-2 justify-center flex-nowrap min-w-0">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    aria-current={isActive ? 'page' : undefined}
                    className={`inline-flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 py-2 rounded-xl text-[13px] xl:text-[14px] transition-all whitespace-nowrap cursor-pointer relative font-semibold shrink-0 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#064e3b] ${
                      isActive
                        ? 'bg-[#064e3b] text-white shadow-xs font-bold'
                        : 'text-stone-600 hover:text-stone-950 hover:bg-stone-100/90'
                    }`}
                  >
                    <Icon className={`w-4 h-4 xl:w-[18px] xl:h-[18px] shrink-0 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                    <span>{item.label}</span>
                    {isActive && (
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-lime-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </nav>

          {/* ========================================================= */}
          {/* 3. RIGHT SECTION: Storefront & Profile Control            */}
          {/* ========================================================= */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Customer Storefront Link */}
            {onSwitchToCustomerStore && (
              <button
                type="button"
                onClick={onSwitchToCustomerStore}
                className="hidden sm:inline-flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-2 text-xs md:text-[13px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100/90 border border-emerald-200/90 rounded-xl transition-colors whitespace-nowrap shadow-2xs cursor-pointer active:scale-95 shrink-0"
                aria-label="Open customer storefront"
              >
                <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Storefront</span>
                <span className="text-xs text-emerald-600 font-bold">↗</span>
              </button>
            )}

            {/* Profile Dropdown Trigger */}
            <div className="relative shrink-0" ref={userMenuRef}>
              <button
                type="button"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                aria-expanded={isUserMenuOpen}
                aria-haspopup="menu"
                aria-label="User account menu"
                className="flex items-center gap-2 sm:gap-2.5 p-1 sm:p-1.5 rounded-xl hover:bg-stone-100 transition-colors text-left group cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#064e3b]"
              >
                {/* Circular Avatar with Initials (36–40px) */}
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-100 text-[#064e3b] font-extrabold text-xs sm:text-sm flex items-center justify-center border border-emerald-300 shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                  {initials}
                </div>

                {/* Role label ONLY (e.g., Admin or Staff) */}
                <span className="text-xs sm:text-[13px] font-semibold text-emerald-800 select-none">
                  {shortRoleLabel}
                </span>

                {/* Small dropdown chevron */}
                <ChevronDown
                  className={`w-4 h-4 text-stone-500 group-hover:text-stone-700 transition-transform shrink-0 ${
                    isUserMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Profile Dropdown Menu */}
              {isUserMenuOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-2 w-[290px] sm:w-[310px] max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-stone-200/90 py-2 z-50 animate-in fade-in zoom-in-95 duration-100"
                >
                  {/* Account Summary Header */}
                  <div className="px-4 py-3 border-b border-stone-100 space-y-1 bg-stone-50/60 rounded-t-xl">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-stone-900 block truncate" title={user?.fullName || user?.username}>
                        {user?.fullName || user?.username}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200 shrink-0 shadow-2xs">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {user?.role?.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{roleLabel}</span>
                    </div>
                    <div className="text-[11px] text-stone-500 font-mono truncate" title={user?.email || `${user?.username}@apexretail.local`}>
                      {user?.email || `${user?.username}@apexretail.local`}
                    </div>
                  </div>

                  {/* Menu Links */}
                  <div className="py-1 text-xs text-stone-700">
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => {
                          handleSelectTab('settings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-stone-50 hover:text-stone-900 transition-colors font-medium cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-stone-400" />
                        <span>System Settings</span>
                      </button>
                    )}

                    {onSwitchToCustomerStore && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onSwitchToCustomerStore();
                        }}
                        className="w-full text-left px-4 py-2.5 flex items-center gap-2.5 hover:bg-stone-50 hover:text-emerald-800 transition-colors font-medium cursor-pointer"
                      >
                        <Store className="w-4 h-4 text-emerald-600" />
                        <span>Open Customer Storefront ↗</span>
                      </button>
                    )}
                  </div>

                  {/* Sign Out Action */}
                  <div className="pt-1 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile & Tablet Navigation Drawer Toggle (< lg) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((prev) => !prev)}
              aria-label={isMobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
              aria-expanded={isMobileMenuOpen}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#064e3b]"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RESPONSIVE MOBILE & TABLET NAVIGATION DRAWER (< lg)       */}
      {/* ========================================================= */}
      {isMobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-stone-950/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div
            ref={mobileMenuRef}
            className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl flex flex-col z-10 animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="p-4 border-b border-stone-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-extrabold text-xs">
                  RF
                </div>
                <div>
                  <span className="font-extrabold text-sm text-stone-900 block leading-tight">
                    RetailFlow
                  </span>
                  <span className="text-[10px] font-semibold text-emerald-800 uppercase">
                    Operations
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* User Session Snapshot */}
            <div className="p-4 bg-stone-50 border-b border-stone-200">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-[#064e3b] font-bold text-xs flex items-center justify-center border border-emerald-300 shrink-0">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-bold text-xs text-stone-900 block truncate leading-tight" title={user?.fullName || user?.username}>
                    {user?.fullName || user?.username}
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold block capitalize">
                    {roleLabel}
                  </span>
                  <span className="text-[10px] text-stone-400 font-mono block truncate">
                    {user?.email || `${user?.username}@apexretail.local`}
                  </span>
                </div>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 py-1 block">
                Operations Menu
              </span>
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleSelectTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#064e3b] text-white shadow-xs font-bold'
                        : 'text-stone-700 hover:bg-stone-100 hover:text-stone-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-stone-500'}`} />
                    <span className="flex-1">{item.label}</span>
                    {isActive && (
                      <span
                        className="w-2 h-2 rounded-full bg-lime-400 shrink-0"
                        aria-hidden="true"
                      />
                    )}
                  </button>
                );
              })}

              {onSwitchToCustomerStore && (
                <div className="pt-3 mt-3 border-t border-stone-200">
                  <span className="text-[10px] font-bold text-stone-400 uppercase tracking-wider px-3 py-1 block">
                    Public Store
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      onSwitchToCustomerStore();
                    }}
                    className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 transition-colors text-left cursor-pointer"
                  >
                    <Store className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Open Customer Storefront ↗</span>
                  </button>
                </div>
              )}
            </nav>

            {/* Drawer Footer / Sign Out */}
            <div className="p-4 border-t border-stone-200 bg-white">
              <button
                type="button"
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-bold text-rose-600 bg-rose-50 hover:bg-rose-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
