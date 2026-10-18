import React, { lazy, Suspense, useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { CustomerAuthProvider, useCustomerAuth } from './context/CustomerAuthContext.tsx';
import { Header, ActiveTab } from './components/Header.tsx';
import { LoginPage } from './pages/LoginPage.tsx';
import { CustomerStorePage } from './pages/CustomerStorePage.tsx';
import { CustomerAuthPage } from './pages/CustomerAuthPage.tsx';
import { CustomerAccountPage } from './pages/CustomerAccountPage.tsx';
import { PrintInvoiceModal } from './components/PrintInvoiceModal.tsx';
const DashboardPage = lazy(() => import('./pages/DashboardPage.tsx').then((m) => ({ default: m.DashboardPage })));
const PosPage = lazy(() => import('./pages/PosPage.tsx').then((m) => ({ default: m.PosPage })));
const ProductsPage = lazy(() => import('./pages/ProductsPage.tsx').then((m) => ({ default: m.ProductsPage })));
const InventoryPage = lazy(() => import('./pages/InventoryPage.tsx').then((m) => ({ default: m.InventoryPage })));
const SalesPage = lazy(() => import('./pages/SalesPage.tsx').then((m) => ({ default: m.SalesPage })));
const ReportsPage = lazy(() => import('./pages/ReportsPage.tsx').then((m) => ({ default: m.ReportsPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage.tsx').then((m) => ({ default: m.SettingsPage })));
const BannersPage = lazy(() => import('./pages/BannersPage.tsx').then((m) => ({ default: m.BannersPage })));
const StockAdjustmentModal = lazy(() => import('./components/StockAdjustmentModal.tsx').then((m) => ({ default: m.StockAdjustmentModal })));
import { Product, Sale, StoreConfig } from './types/index.ts';
import { api } from './api/client.ts';

type ViewMode =
  | 'customer'
  | 'customer_login'
  | 'customer_register'
  | 'customer_account'
  | 'staff_login'
  | 'management';

function MainApp() {
  const { user, loading: employeeLoading, isAdmin } = useAuth();
  const { customer, loading: customerLoading } = useCustomerAuth();

  const getInitialViewMode = (): ViewMode => {
    const path = window.location.pathname;
    if (path === '/customer/login') return 'customer_login';
    if (path === '/customer/register') return 'customer_register';
    if (path === '/customer/account' || path === '/customer/orders') return 'customer_account';
    if (path === '/staff/login' || path === '/admin/login' || path === '/employee/login') {
      return 'staff_login';
    }
    if (path === '/portal' || path === '/admin' || path === '/management' || path.startsWith('/admin/')) {
      return 'management';
    }
    return 'customer';
  };

  const getInitialActiveTab = (): ActiveTab => {
    const path = window.location.pathname;
    if (path === '/admin/banners' || path === '/management/banners') {
      return 'banners';
    }
    return 'dashboard';
  };

  const [viewMode, setViewMode] = useState<ViewMode>(getInitialViewMode);
  const [activeTab, setActiveTab] = useState<ActiveTab>(getInitialActiveTab);
  const [config, setConfig] = useState<StoreConfig | null>(null);

  // Global modals
  const [latestSale, setLatestSale] = useState<Sale | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const navigateTo = (mode: ViewMode) => {
    setViewMode(mode);
    const pathMap: Record<ViewMode, string> = {
      customer: '/',
      customer_login: '/customer/login',
      customer_register: '/customer/register',
      customer_account: '/customer/account',
      staff_login: '/staff/login',
      management: '/portal'
    };
    const targetPath = pathMap[mode] || '/';
    if (window.location.pathname !== targetPath) {
      window.history.pushState({}, '', targetPath);
    }
  };

  useEffect(() => {
    const handlePopState = () => {
      setViewMode(getInitialViewMode());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    api
      .getConfig()
      .then((res) => setConfig(res.config))
      .catch((err) => console.error('Failed to load store config', err));
  }, []);

  // When an employee logs in from staff_login, auto-switch to management view
  useEffect(() => {
    if (user && viewMode === 'staff_login') {
      navigateTo('management');
    }
  }, [user]);

  useEffect(() => {
    if ((activeTab === 'settings' || activeTab === 'banners') && !isAdmin) {
      setActiveTab('dashboard');
    }
  }, [activeTab, isAdmin]);

  if (employeeLoading || customerLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-[#064e3b] border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-semibold text-stone-500">Initializing RetailFlow...</span>
        </div>
      </div>
    );
  }

  // 1. Separate Customer Storefront View (Default public catalog)
  if (viewMode === 'customer') {
    return (
      <CustomerStorePage
        config={config}
        onOpenStaffPortal={() => {
          if (user) {
            navigateTo('management');
          } else {
            navigateTo('staff_login');
          }
        }}
        onNavigate={(route) => navigateTo(route)}
      />
    );
  }

  // 2. Separate Full-page Customer Login View
  if (viewMode === 'customer_login') {
    return (
      <CustomerAuthPage
        mode="login"
        config={config}
        onBackToStore={() => navigateTo('customer')}
        onSuccess={() => navigateTo('customer')}
        onSwitchMode={(mode) => navigateTo(mode === 'login' ? 'customer_login' : 'customer_register')}
        onOpenStaffPortal={() => navigateTo('staff_login')}
      />
    );
  }

  // 3. Separate Full-page Customer Registration View
  if (viewMode === 'customer_register') {
    return (
      <CustomerAuthPage
        mode="register"
        config={config}
        onBackToStore={() => navigateTo('customer')}
        onSuccess={() => navigateTo('customer')}
        onSwitchMode={(mode) => navigateTo(mode === 'login' ? 'customer_login' : 'customer_register')}
        onOpenStaffPortal={() => navigateTo('staff_login')}
      />
    );
  }

  // 4. Separate Customer Account & Orders Page
  if (viewMode === 'customer_account') {
    if (!customer) {
      return (
        <CustomerAuthPage
          mode="login"
          config={config}
          onBackToStore={() => navigateTo('customer')}
          onSuccess={() => navigateTo('customer_account')}
          onSwitchMode={(mode) => navigateTo(mode === 'login' ? 'customer_login' : 'customer_register')}
          onOpenStaffPortal={() => navigateTo('staff_login')}
        />
      );
    }

    return (
      <CustomerAccountPage
        config={config}
        onBackToStore={() => navigateTo('customer')}
        onOpenStaffPortal={() => navigateTo(user ? 'management' : 'staff_login')}
      />
    );
  }

  // 5. Staff / Admin Login View (or unauthenticated management access)
  if ((viewMode === 'staff_login' || viewMode === 'management') && !user) {
    return <LoginPage onBackToStore={() => navigateTo('customer')} config={config} />;
  }

  // 6. Full Staff & Admin Management Backoffice (POS, Products, Inventory, Sales, Reports, Settings, Banners)
  return (
    <div className="min-h-screen bg-slate-50/50 flex flex-col font-sans text-slate-900">
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onSwitchToCustomerStore={() => navigateTo('customer')}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Suspense fallback={<div className="min-h-[45vh] grid place-items-center text-sm text-stone-500" role="status">Loading workspace…</div>}>
        {activeTab === 'dashboard' && (
          <DashboardPage
            setActiveTab={setActiveTab}
            onOpenAdjustment={(product) => setAdjustingProduct(product)}
          />
        )}

        {activeTab === 'pos' && (
          <PosPage
            config={config}
            onSaleComplete={(sale) => setLatestSale(sale)}
          />
        )}

        {activeTab === 'products' && (
          <ProductsPage
            config={config}
            onSaleComplete={(sale) => setLatestSale(sale)}
          />
        )}

        {activeTab === 'inventory' && <InventoryPage />}

        {activeTab === 'sales' && <SalesPage config={config} />}

        {activeTab === 'reports' && <ReportsPage />}

        {activeTab === 'banners' && isAdmin && (
          <BannersPage onSwitchToCustomerStore={() => navigateTo('customer')} />
        )}

        {activeTab === 'settings' && isAdmin && (
          <SettingsPage config={config} onConfigUpdated={(cfg) => setConfig(cfg)} />
        )}
        </Suspense>
      </main>

      {/* Global Invoice / Receipt Modal after POS checkout */}
      {latestSale && (
        <PrintInvoiceModal
          sale={latestSale}
          config={config}
          onClose={() => setLatestSale(null)}
        />
      )}

      {/* Global Stock Adjustment Modal */}
      {adjustingProduct && (
        <Suspense fallback={null}>
        <StockAdjustmentModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSuccess={() => {
            setAdjustingProduct(null);
          }}
        />
        </Suspense>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] text-slate-500">
          <div>
            <span>{config?.storeName || 'Apex Retail Mart'}</span>
            <span className="mx-2">·</span>
            <span>Retail Inventory & Sales Management System</span>
          </div>
          <div className="font-mono text-slate-400">
            GSTIN: {config?.gstin || '07AAAAA0000A1Z5'}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CustomerAuthProvider>
        <MainApp />
      </CustomerAuthProvider>
    </AuthProvider>
  );
}
