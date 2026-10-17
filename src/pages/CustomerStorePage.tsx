import React, { useState, useEffect } from 'react';
import { Product, Sale, StoreConfig } from '../types/index.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useCustomerAuth } from '../context/CustomerAuthContext.tsx';
import { ProductImage } from '../components/ProductImage.tsx';
import { CartDrawer, CartItem } from '../components/CartDrawer.tsx';
import { CustomerOrdersModal } from '../components/CustomerOrdersModal.tsx';
import { CustomerAuthModal } from '../components/CustomerAuthModal.tsx';
import { ProductQuickViewModal } from '../components/ProductQuickViewModal.tsx';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal.tsx';
import { HeroCarousel } from '../components/HeroCarousel.tsx';
import { ApexLogo } from '../components/ApexLogo.tsx';
import {
  Search,
  ShoppingCart,
  Receipt,
  ShieldCheck,
  Truck,
  Sparkles,
  ArrowUpDown,
  X,
  Eye,
  Check,
  Package,
  Lock,
  ArrowRight,
  Store,
  ChevronRight,
  UserCheck,
  Shield,
  Clock,
  CheckCircle2,
  SlidersHorizontal,
  ChevronDown,
  LogIn,
  UserPlus,
  User as UserIcon
} from 'lucide-react';

interface CustomerStorePageProps {
  config: StoreConfig | null;
  onOpenStaffPortal: () => void;
  onNavigate?: (route: 'customer' | 'customer_login' | 'customer_register' | 'customer_account') => void;
}

export const CustomerStorePage: React.FC<CustomerStorePageProps> = ({
  config,
  onOpenStaffPortal,
  onNavigate
}) => {
  const { user, isAdmin } = useAuth();
  const {
    customer,
    logout: customerLogout,
    pendingCartItem,
    setPendingCartItem,
    isAuthModalOpen,
    authModalInitialTab,
    openAuthModal,
    closeAuthModal
  } = useCustomerAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [category, setCategory] = useState<string>('all');
  const [stockStatus, setStockStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState<boolean>(false);

  // Modals
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Sale | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes] = await Promise.all([
        api.getProducts({
          search,
          category,
          stockStatus,
          isActive: true, // Customers only see active products
          page,
          limit: 16, // 4 clean rows of 4 cards on desktop
          sortBy,
          sortOrder
        }),
        api.getCategories()
      ]);

      setProducts(prodRes.products);
      setTotal(prodRes.total);
      setTotalPages(prodRes.totalPages);
      setCategories(catRes.categories);
    } catch (err: any) {
      setError(err.message || 'Failed to load product catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category, stockStatus, page, sortBy, sortOrder]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('all');
    setStockStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = search.trim() !== '' || category !== 'all' || stockStatus !== 'all';

  // Cart Handlers
  const handleAddToCartDirect = (product: Product, quantityToAdd: number = 1) => {
    if (product.availableStock <= 0 || !product.isActive) return;

    setCart((prevCart) => {
      const existing = prevCart.find((it) => it.product._id === product._id);
      if (existing) {
        const newQty = existing.quantity + quantityToAdd;
        if (newQty > product.availableStock) {
          alert(`Maximum available stock for '${product.name}' is ${product.availableStock}.`);
          return prevCart;
        }
        return prevCart.map((it) =>
          it.product._id === product._id ? { ...it, quantity: newQty } : it
        );
      } else {
        return [...prevCart, { product, quantity: Math.min(quantityToAdd, product.availableStock) }];
      }
    });
  };

  // Requirement 2: Intercept unauthenticated visitors adding to cart
  const handleAddToCart = (product: Product, quantityToAdd: number = 1) => {
    if (product.availableStock <= 0 || !product.isActive) return;

    if (!customer) {
      openAuthModal('login', { product, quantity: quantityToAdd });
      return;
    }

    handleAddToCartDirect(product, quantityToAdd);
  };

  // Restore and add pending item after successful customer authentication
  useEffect(() => {
    if (customer && pendingCartItem) {
      handleAddToCartDirect(pendingCartItem.product, pendingCartItem.quantity);
      setPendingCartItem(null);
      setIsCartOpen(true);
    }
  }, [customer, pendingCartItem]);

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((it) => {
          if (it.product._id === productId) {
            const newQty = it.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > it.product.availableStock) {
              alert(`Maximum available stock for '${it.product.name}' is ${it.product.availableStock}.`);
              return it;
            }
            return { ...it, quantity: newQty };
          }
          return it;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCart((prevCart) => prevCart.filter((it) => it.product._id !== productId));
  };

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const currencySymbol = '₹';
  const storeTitle = config?.storeName || 'Apex Retail Mart';

  const scrollToCatalog = () => {
    const el = document.getElementById('catalog-toolbar');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleHomeClick = () => {
    handleClearFilters();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (onNavigate) {
      onNavigate('customer');
    }
  };

  return (
    <div className="min-h-screen bg-[#faf9f6] flex flex-col font-sans text-stone-900">
      {/* 1. Top Enterprise Notice Bar */}
      <div className="bg-[#042017] text-stone-200 text-[11px] py-2 px-4 border-b border-[#083325]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse shrink-0" />
            <span className="font-semibold text-stone-100">{storeTitle} Official Catalog</span>
            <span className="text-emerald-800 hidden sm:inline">|</span>
            <span className="text-stone-300 hidden sm:inline">
              Real-time on-hand inventory · Immediate click & collect · Authoritative GST billing
            </span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="flex items-center gap-2 bg-[#073627] px-2.5 py-0.5 rounded-md border border-[#0d4f3b]">
                <span className="text-stone-300 text-[11px]">
                  Employee session: <strong className="text-white font-medium">{user.fullName || user.username}</strong>
                </span>
                <button
                  onClick={onOpenStaffPortal}
                  className="text-lime-300 hover:text-lime-200 font-semibold underline underline-offset-2 ml-1 text-[11px] transition-colors cursor-pointer"
                >
                  Backoffice Portal →
                </button>
              </div>
            ) : (
              <button
                onClick={onOpenStaffPortal}
                className="text-stone-400 hover:text-white transition-colors flex items-center gap-1.5 font-medium text-[11px] cursor-pointer"
                title="Store Staff & Administrator Access"
              >
                <Lock className="w-3 h-3 text-emerald-400" />
                <span>Employee Portal</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Store Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200/90 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Main Desktop & Tablet Row: Brand, Search, My Account, Cart */}
          <div className="flex items-center justify-between gap-3 sm:gap-6 h-16 sm:h-20">
            {/* Left: Brand Logo & Title (Clickable Home Action) */}
            <button
              type="button"
              onClick={handleHomeClick}
              className="flex items-center text-left group cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#064e3b] rounded-2xl p-1 -m-1 transition-opacity hover:opacity-90 shrink-0"
              aria-label="Apex Retail Mart Home"
              title="Apex Retail Mart - Return to Storefront Homepage"
            >
              <ApexLogo iconSize={44} />
            </button>

            {/* Center: Global Search Bar (Desktop & Tablet) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-4 lg:mx-8 relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products by title, SKU, or category..."
                className="w-full pl-10 pr-9 py-2.5 bg-stone-50 hover:bg-white focus:bg-white border border-stone-200 rounded-xl text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b] focus:border-transparent transition-all shadow-2xs"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400 hover:text-stone-700 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Right: My Account Action & Cart Trigger */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* My Account Button */}
              <button
                type="button"
                onClick={() => {
                  if (customer) {
                    if (onNavigate) {
                      onNavigate('customer_account');
                    } else {
                      setIsOrdersModalOpen(true);
                    }
                  } else {
                    openAuthModal('login');
                  }
                }}
                className="flex items-center gap-2.5 px-2.5 sm:px-3 py-1.5 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer text-left group"
                title={customer ? `Signed in as ${customer.fullName}` : 'Sign in to your account'}
                aria-label={customer ? `Account: ${customer.fullName}` : 'Log in to My Account'}
              >
                <div className="w-9 h-9 rounded-full bg-stone-100 group-hover:bg-emerald-50 text-stone-700 group-hover:text-[#064e3b] flex items-center justify-center border border-stone-200 transition-colors shrink-0">
                  <UserIcon className="w-4 h-4" />
                </div>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className="text-[13px] font-bold text-stone-900 group-hover:text-[#064e3b] transition-colors">
                    My Account
                  </span>
                  <span className="text-[11px] text-stone-500 font-medium truncate max-w-[120px]">
                    {customer ? customer.fullName.split(' ')[0] : 'Log in'}
                  </span>
                </div>
              </button>

              {/* Shopping Cart Button with Live Badge */}
              <button
                type="button"
                onClick={() => setIsCartOpen(true)}
                className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white transition-all shadow-xs active:scale-95 cursor-pointer relative shrink-0"
                title="View Shopping Cart"
                aria-label={`Cart with ${totalCartCount} items`}
              >
                <div className="relative">
                  <ShoppingCart className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
                  {totalCartCount > 0 && (
                    <span className="absolute -top-2 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-lime-400 text-stone-950 text-[10px] flex items-center justify-center font-mono font-extrabold shadow-xs">
                      {totalCartCount}
                    </span>
                  )}
                </div>
                <span className="hidden sm:inline text-xs font-bold">Cart</span>
              </button>
            </div>
          </div>

          {/* Mobile Search Bar (Only shown on small screens) */}
          <div className="md:hidden pb-2.5 pt-0.5">
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-stone-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                placeholder="Search products by title, SKU..."
                className="w-full pl-10 pr-9 py-2 bg-stone-50 border border-stone-200 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear search"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-stone-400"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Category Navigation Bar */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2.5 border-t border-stone-100 text-xs">
            <span className="text-stone-400 font-medium mr-1 shrink-0 text-[11px] uppercase tracking-wider font-mono">
              Categories:
            </span>
            <button
              onClick={() => {
                setCategory('all');
                setPage(1);
              }}
              className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                category === 'all'
                  ? 'bg-[#064e3b] text-white shadow-2xs'
                  : 'bg-stone-100/80 text-stone-600 hover:bg-stone-200/80'
              }`}
            >
              All Items ({total})
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setPage(1);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  category === c
                    ? 'bg-[#064e3b] text-white shadow-2xs'
                    : 'bg-stone-100/80 text-stone-600 hover:bg-stone-200/80'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* 3. Promotional Campaign Hero Carousel (Replaces Old Dark-Green Hero) */}
      <HeroCarousel
        categories={categories}
        onSelectCategory={(cat) => {
          setCategory(cat);
          setPage(1);
        }}
        onScrollToCatalog={scrollToCatalog}
      />

      {/* 4. Product Catalog Grid */}
      <main id="catalog-toolbar" className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {error && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={fetchProducts}
              className="text-xs font-semibold underline underline-offset-2 hover:text-rose-900"
            >
              Retry
            </button>
          </div>
        )}

        {/* 5. Loading Skeletons */}
        {loading && products.length === 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {Array.from({ length: 8 }).map((_, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-stone-200 p-4 space-y-3 animate-pulse"
              >
                <div className="w-full aspect-square bg-stone-100 rounded-xl" />
                <div className="h-4 bg-stone-100 rounded-sm w-3/4" />
                <div className="h-3 bg-stone-100 rounded-sm w-1/2" />
                <div className="h-9 bg-stone-100 rounded-xl w-full mt-2" />
              </div>
            ))}
          </div>
        )}

        {/* 6. Product Cards Grid (4 columns desktop, 3 columns md, 2 columns mobile) */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {products.map((p) => {
              const inCartItem = cart.find((it) => it.product._id === p._id);
              const inCartQty = inCartItem?.quantity || 0;
              const remainingStock = p.availableStock - inCartQty;

              const isOutOfStock = p.availableStock <= 0;
              const isLowStock = p.availableStock > 0 && p.availableStock <= p.reorderLevel;
              const canAddToCart = p.isActive && !isOutOfStock && remainingStock > 0;

              return (
                <div
                  key={p._id}
                  className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md transition-all duration-300 flex flex-col justify-between overflow-hidden group relative"
                >
                  {/* Top Section: Product Image & Availability Badges */}
                  <div>
                    <div className="relative aspect-square w-full bg-[#f5f5f3] flex items-center justify-center overflow-hidden border-b border-stone-100">
                      <ProductImage
                        src={p.imageUrl}
                        alt={p.name}
                        size="lg"
                        category={p.category}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                      />

                      {/* Stock Status Badge */}
                      <div className="absolute top-3 left-3 z-10">
                        {isOutOfStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-300/80 shadow-2xs">
                            Sold Out
                          </span>
                        ) : isLowStock ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                            Only {p.availableStock} left
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                            In Stock
                          </span>
                        )}
                      </div>

                      {/* Quick View Button on Image Hover */}
                      <button
                        onClick={() => setQuickViewProduct(p)}
                        className="absolute bottom-3 right-3 p-2 bg-white/95 backdrop-blur-xs text-stone-800 hover:text-stone-950 rounded-xl shadow-xs opacity-0 group-hover:opacity-100 transition-opacity border border-stone-200 text-xs font-semibold flex items-center gap-1 z-10 active:scale-95"
                        title="View specifications and details"
                      >
                        <Eye className="w-3.5 h-3.5 text-stone-600" />
                        <span className="text-[11px] hidden sm:inline">Quick View</span>
                      </button>
                    </div>

                    {/* Product Metadata & Details */}
                    <div className="p-4 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] text-stone-400 font-mono">
                        <span className="text-[#064e3b] font-sans uppercase tracking-wider text-[10px] font-bold bg-emerald-50 px-2 py-0.5 rounded">
                          {p.category}
                        </span>
                        <span className="text-stone-400">{p.sku}</span>
                      </div>

                      <h3
                        onClick={() => setQuickViewProduct(p)}
                        className="font-bold text-stone-900 text-sm line-clamp-2 leading-snug group-hover:text-[#064e3b] cursor-pointer transition-colors"
                        title={p.name}
                      >
                        {p.name}
                      </h3>

                      {p.description && (
                        <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">
                          {p.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bottom Section: Clear Selling Price & Add to Cart */}
                  <div className="p-4 pt-0">
                    <div className="pt-3 border-t border-stone-100 flex items-center justify-between gap-2">
                      <div>
                        <div className="text-[10px] text-stone-400 uppercase tracking-wider font-semibold font-mono">
                          Price
                        </div>
                        <div className="font-mono text-base font-extrabold text-stone-950 tabular-nums">
                          {currencySymbol}
                          {p.sellingPrice.toFixed(2)}
                          <span className="text-xs font-normal text-stone-400 ml-1">
                            /{p.unit || 'pcs'}
                          </span>
                        </div>
                      </div>

                      {/* Add to Cart or Stepper */}
                      {inCartQty > 0 ? (
                        <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 overflow-hidden shadow-2xs">
                          <button
                            onClick={() => handleUpdateCartQuantity(p._id, -1)}
                            className="px-2.5 py-1.5 text-stone-700 hover:bg-stone-200 transition-colors font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 text-xs font-mono font-bold text-stone-900 tabular-nums">
                            {inCartQty}
                          </span>
                          <button
                            onClick={() => handleAddToCart(p, 1)}
                            disabled={!canAddToCart}
                            className="px-2.5 py-1.5 text-stone-700 hover:bg-stone-200 transition-colors font-bold disabled:opacity-40"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToCart(p, 1)}
                          disabled={!canAddToCart}
                          className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all shadow-2xs active:scale-95 ${
                            canAddToCart
                              ? 'bg-[#064e3b] hover:bg-[#043d2e] text-white'
                              : 'bg-stone-100 text-stone-400 cursor-not-allowed border border-stone-200'
                          }`}
                        >
                          <ShoppingCart className="w-3.5 h-3.5" />
                          <span>{isOutOfStock ? 'Sold Out' : 'Add to Cart'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty Catalog State */}
        {products.length === 0 && !loading && (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center space-y-3 shadow-2xs">
            <Package className="w-12 h-12 mx-auto text-stone-300 stroke-1" />
            <h4 className="text-sm font-bold text-stone-800">No products found</h4>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              We couldn't find items matching your criteria. Try adjusting keywords or clearing category filters.
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs font-bold rounded-xl transition-colors shadow-xs"
              >
                Clear All Filters
              </button>
            )}
          </div>
        )}

        {/* Pagination */}
        {products.length > 0 && totalPages > 1 && (
          <div className="px-6 py-4 bg-white border border-stone-200 rounded-2xl flex items-center justify-between text-xs text-stone-600 shadow-2xs">
            <div>
              Page <span className="font-mono font-bold text-stone-900">{page}</span> of{' '}
              <span className="font-mono font-bold text-stone-900">{totalPages}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3.5 py-1.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-40 transition-colors shadow-2xs font-semibold"
              >
                Previous
              </button>
              <span className="font-mono tabular-nums px-2 font-semibold">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3.5 py-1.5 bg-white border border-stone-200 rounded-xl hover:bg-stone-50 disabled:opacity-40 transition-colors shadow-2xs font-semibold"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={() => setCart([])}
        config={config}
        onCheckoutSuccess={(sale) => {
          setCompletedOrder(sale);
        }}
      />

      {/* Product Quick View Modal */}
      {quickViewProduct && (
        <ProductQuickViewModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={handleAddToCart}
          inCartQty={cart.find((c) => c.product._id === quickViewProduct._id)?.quantity || 0}
        />
      )}

      {/* Customer Orders & Receipts Modal */}
      <CustomerOrdersModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        config={config}
      />

      {/* Customer Login / Registration Modal */}
      <CustomerAuthModal
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        initialTab={authModalInitialTab}
      />

      {/* Completed Order Invoice Modal */}
      {completedOrder && (
        <PrintInvoiceModal
          sale={completedOrder}
          config={config}
          onClose={() => setCompletedOrder(null)}
        />
      )}

      {/* Clean Footer */}
      <footer className="border-t border-stone-200 bg-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-stone-500">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-md bg-[#064e3b] text-white flex items-center justify-center font-bold text-[10px]">
              RF
            </span>
            <span className="font-semibold text-stone-700">{storeTitle}</span>
            <span>·</span>
            <span>Customer Retail Catalog</span>
          </div>
          <div className="font-mono text-stone-400 text-[11px]">
            Authoritative Invoicing · GSTIN: {config?.gstin || '07AAAAA0000A1Z5'}
          </div>
        </div>
      </footer>
    </div>
  );
};
