import React, { useState, useEffect } from 'react';
import { Product, Sale, StoreConfig } from '../types/index.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { ProductModal } from '../components/ProductModal.tsx';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal.tsx';
import { ProductImage } from '../components/ProductImage.tsx';
import { CartDrawer, CartItem } from '../components/CartDrawer.tsx';
import {
  Search,
  Plus,
  Edit2,
  Power,
  RefreshCw,
  PackagePlus,
  ArrowUpDown,
  ShoppingCart,
  Check,
  X,
  LayoutGrid,
  Table as TableIcon,
  Filter,
  Package,
  AlertTriangle,
  Cloud
} from 'lucide-react';

interface ProductsPageProps {
  config?: StoreConfig | null;
  onSaleComplete?: (sale: Sale) => void;
}

export const ProductsPage: React.FC<ProductsPageProps> = ({ config, onSaleComplete }) => {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [cloudinaryInfo, setCloudinaryInfo] = useState<{
    isConfigured: boolean;
    cloudName: string;
  } | null>(null);

  // View mode: 'grid' (modern retail shopping cards) vs 'table' (inventory ledger)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

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

  // Modals state
  const [isProductModalOpen, setIsProductModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const [prodRes, catRes, cloudRes] = await Promise.all([
        api.getProducts({
          search,
          category,
          stockStatus,
          page,
          limit: viewMode === 'grid' ? 16 : 15, // 16 items gives 4 balanced rows of 4 cards on desktop
          sortBy,
          sortOrder
        }),
        api.getCategories(),
        api.getCloudinaryStatus().catch(() => null)
      ]);

      setProducts(prodRes.products);
      setTotal(prodRes.total);
      setTotalPages(prodRes.totalPages);
      setCategories(catRes.categories);
      if (cloudRes) {
        setCloudinaryInfo(cloudRes);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch product catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, category, stockStatus, page, sortBy, sortOrder, viewMode]);

  const handleClearFilters = () => {
    setSearch('');
    setCategory('all');
    setStockStatus('all');
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  };

  const hasActiveFilters = search.trim() !== '' || category !== 'all' || stockStatus !== 'all';

  // Cart functions
  const handleAddToCart = (product: Product) => {
    if (product.availableStock <= 0 || !product.isActive) return;

    setCart((prevCart) => {
      const existing = prevCart.find((it) => it.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.availableStock) {
          alert(`Cannot add more '${product.name}'. Max available stock is ${product.availableStock}.`);
          return prevCart;
        }
        return prevCart.map((it) =>
          it.product._id === product._id ? { ...it, quantity: it.quantity + 1 } : it
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
  };

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

  const handleClearCart = () => {
    setCart([]);
  };

  const handleToggleStatus = async (product: Product) => {
    if (!isAdmin) return;
    const actionName = product.isActive ? 'deactivate' : 'activate';
    const confirmed = window.confirm(
      `Are you sure you want to ${actionName} '${product.name}' (${product.sku})?`
    );
    if (!confirmed) return;

    try {
      await api.setProductStatus(product._id, !product.isActive);
      await fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to update product status');
    }
  };

  const totalCartCount = cart.reduce((acc, it) => acc + it.quantity, 0);
  const currencySymbol = '₹';

  return (
    <div className="space-y-6">
      {/* Top Bar: Brand, Result Count, View Toggle & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl font-bold tracking-tight text-slate-900">Product Catalog</h1>
            {cloudinaryInfo && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium ${
                  cloudinaryInfo.isConfigured
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                }`}
                title={
                  cloudinaryInfo.isConfigured
                    ? `Connected to Cloudinary (${cloudinaryInfo.cloudName})`
                    : 'Cloudinary credentials pending in .env (using local simulation)'
                }
              >
                <Cloud className="w-3 h-3 text-blue-600" />
                <span>
                  {cloudinaryInfo.isConfigured
                    ? `Cloudinary: ${cloudinaryInfo.cloudName}`
                    : 'Cloudinary: Dev Mode'}
                </span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Browse our complete retail inventory with real-time stock levels and instant ordering
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          {/* View Mode Switcher: Grid vs Table */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-slate-600">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'grid'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
              title="Retail Card Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-md transition-colors ${
                viewMode === 'table'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
              title="Inventory Ledger Table View"
            >
              <TableIcon className="w-4 h-4" />
            </button>
          </div>

          {/* Cart Trigger Button */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-900 text-slate-900 text-xs font-semibold rounded-lg transition-all shadow-xs relative"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Cart</span>
            {totalCartCount > 0 && (
              <span className="w-5 h-5 rounded-full bg-slate-950 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                {totalCartCount}
              </span>
            )}
          </button>

          {/* Admin Add Product Action */}
          {isAdmin && (
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Add Product</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Modern Catalog Toolbar: Search & Refined Filter Controls */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          {/* Search by Name or SKU */}
          <div className="sm:col-span-5 relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search products by name or SKU..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Category Dropdown */}
          <div className="sm:col-span-3">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Stock Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={stockStatus}
              onChange={(e) => {
                setStockStatus(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="all">All Stock Statuses</option>
              <option value="in_stock">In Stock (&gt; reorder)</option>
              <option value="low_stock">Low Stock (≤ reorder)</option>
              <option value="out_of_stock">Out of Stock (0)</option>
            </select>
          </div>

          {/* Sort Control */}
          <div className="sm:col-span-2 flex gap-1">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900 bg-white"
            >
              <option value="createdAt">Newest First</option>
              <option value="name">Name (A-Z)</option>
              <option value="sellingPrice">Price</option>
              <option value="availableStock">Available Stock</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              title={`Sort: ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
              className="px-2.5 py-2 border border-slate-300 hover:bg-slate-50 rounded-lg text-slate-600 transition-colors shrink-0"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Toolbar Sub-Bar: Interactive Category Filter & Result Count */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
            <span className="text-slate-500 font-medium mr-1 shrink-0">Filter by category:</span>
            <button
              onClick={() => {
                setCategory('all');
                setPage(1);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                category === 'all'
                  ? 'bg-slate-900 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => {
                  setCategory(c);
                  setPage(1);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  category === c
                    ? 'bg-slate-900 text-white font-semibold'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <span className="text-slate-500 font-mono text-[11px] tabular-nums">
              Showing <span className="font-semibold text-slate-900">{products.length}</span> of{' '}
              <span className="font-semibold text-slate-900">{total}</span> items
            </span>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                <span>Clear filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && products.length === 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div
              key={idx}
              className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs animate-pulse p-4 space-y-3"
            >
              <div className="w-full aspect-square bg-slate-100 rounded-lg" />
              <div className="h-4 bg-slate-100 rounded-sm w-3/4" />
              <div className="h-3 bg-slate-100 rounded-sm w-1/2" />
              <div className="h-8 bg-slate-100 rounded-lg w-full mt-2" />
            </div>
          ))}
        </div>
      )}

      {/* VIEW 1: MODERN RETAIL CARD GRID (4 products per row on desktop) */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
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
                className={`bg-white rounded-xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between overflow-hidden group ${
                  !p.isActive ? 'opacity-60 bg-slate-50/50' : ''
                }`}
              >
                {/* Top Section: Image & Badges */}
                <div>
                  <div className="relative aspect-square w-full bg-slate-50 flex items-center justify-center overflow-hidden border-b border-slate-100">
                    <ProductImage
                      src={p.imageUrl}
                      alt={p.name}
                      size="lg"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {/* Stock Status Badge */}
                    <div className="absolute top-2.5 left-2.5">
                      {isOutOfStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                          Out of Stock
                        </span>
                      ) : isLowStock ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                          Low Stock: {p.availableStock} {p.unit || 'pcs'}
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                          In Stock ({p.availableStock})
                        </span>
                      )}
                    </div>

                    {/* Admin Action Overlay */}
                    {isAdmin && (
                      <div className="absolute top-2.5 right-2.5 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 backdrop-blur-xs p-1 rounded-lg border border-slate-200 shadow-xs">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setIsProductModalOpen(true);
                          }}
                          title="Edit Details & Image"
                          className="p-1 text-slate-600 hover:text-slate-900 rounded-md transition-colors"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => setAdjustingProduct(p)}
                          title="Receive Stock"
                          className="p-1 text-slate-600 hover:text-slate-900 rounded-md transition-colors"
                        >
                          <PackagePlus className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(p)}
                          title={p.isActive ? 'Deactivate' : 'Activate'}
                          className={`p-1 rounded-md transition-colors ${
                            p.isActive
                              ? 'text-slate-400 hover:text-rose-600'
                              : 'text-slate-400 hover:text-emerald-600'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Product Metadata & Information */}
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                      <span>{p.sku}</span>
                      <span className="text-slate-500 font-sans">{p.category}</span>
                    </div>

                    <h3
                      className="font-semibold text-slate-900 text-sm line-clamp-2 leading-snug group-hover:text-slate-950"
                      title={p.name}
                    >
                      {p.name}
                    </h3>

                    {p.description && (
                      <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                        {p.description}
                      </p>
                    )}
                  </div>
                </div>

                {/* Bottom Section: Price & Add to Cart Button */}
                <div className="p-4 pt-0">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                        Price
                      </div>
                      <div className="font-mono text-base font-bold text-slate-900 tabular-nums">
                        {currencySymbol}
                        {p.sellingPrice.toFixed(2)}
                        <span className="text-xs font-normal text-slate-400 ml-1">
                          /{p.unit || 'pcs'}
                        </span>
                      </div>
                    </div>

                    {/* Add to Cart or Stepper */}
                    {inCartQty > 0 ? (
                      <div className="flex items-center border border-slate-300 rounded-lg bg-slate-50 overflow-hidden shadow-2xs">
                        <button
                          onClick={() => handleUpdateCartQuantity(p._id, -1)}
                          className="px-2 py-1.5 text-slate-700 hover:bg-slate-200 transition-colors"
                        >
                          -
                        </button>
                        <span className="px-2 text-xs font-mono font-bold text-slate-900 tabular-nums">
                          {inCartQty}
                        </span>
                        <button
                          onClick={() => handleAddToCart(p)}
                          disabled={!canAddToCart}
                          className="px-2 py-1.5 text-slate-700 hover:bg-slate-200 transition-colors disabled:opacity-40"
                        >
                          +
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleAddToCart(p)}
                        disabled={!canAddToCart}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all shadow-2xs ${
                          canAddToCart
                            ? 'bg-slate-900 hover:bg-slate-800 text-white active:scale-95'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                        }`}
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>{isOutOfStock ? 'Sold Out' : !p.isActive ? 'Inactive' : 'Add to Cart'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 2: INVENTORY LEDGER TABLE VIEW (For detailed administrative audits) */}
      {viewMode === 'table' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-left font-medium">
                  <th className="py-3 px-4 w-12 text-center">Image</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Product Name & Category</th>
                  <th className="py-3 px-4 text-right">Cost Price</th>
                  <th className="py-3 px-4 text-right">Selling Price</th>
                  <th className="py-3 px-4 text-center">Available Stock</th>
                  <th className="py-3 px-4 text-center">Reorder Threshold</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => {
                  const isOutOfStock = p.availableStock === 0;
                  const isLowStock = p.availableStock > 0 && p.availableStock <= p.reorderLevel;

                  return (
                    <tr
                      key={p._id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        !p.isActive ? 'opacity-50 bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="py-2.5 px-4 text-center">
                        <div
                          onClick={() => {
                            if (isAdmin) {
                              setEditingProduct(p);
                              setIsProductModalOpen(true);
                            }
                          }}
                          className={`w-10 h-10 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 inline-block shadow-2xs ${
                            isAdmin ? 'cursor-pointer hover:border-slate-900 transition-colors' : ''
                          }`}
                          title={isAdmin ? 'Click to manage image' : p.name}
                        >
                          <ProductImage
                            src={p.imageUrl}
                            alt={p.name}
                            size="sm"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                        {p.sku}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900">{p.name}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                          <span>{p.category}</span>
                          <span>·</span>
                          <span>{p.unit || 'pcs'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                        {currencySymbol}{p.purchasePrice.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-slate-900 whitespace-nowrap">
                        {currencySymbol}{p.sellingPrice.toFixed(2)}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`font-mono font-bold tabular-nums text-sm ${
                            isOutOfStock
                              ? 'text-rose-600'
                              : isLowStock
                              ? 'text-amber-600'
                              : 'text-slate-900'
                          }`}
                        >
                          {p.availableStock}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-500 whitespace-nowrap">
                        {p.reorderLevel}
                      </td>

                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span
                          className={`text-[11px] font-medium ${
                            p.isActive ? 'text-emerald-700' : 'text-slate-400'
                          }`}
                        >
                          {p.isActive ? 'Active' : 'Deactivated'}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          {isAdmin && (
                            <button
                              onClick={() => setAdjustingProduct(p)}
                              title="Adjust Stock / Receive Shipment"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <PackagePlus className="w-4 h-4" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              title="Edit Product"
                              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {isAdmin && (
                            <button
                              onClick={() => handleToggleStatus(p)}
                              title={p.isActive ? 'Deactivate Product' : 'Reactivate Product'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                p.isActive
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {products.length === 0 && !loading && (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-3">
          <Package className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
          <h4 className="text-sm font-semibold text-slate-800">No products match your criteria</h4>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Try adjusting your search query, selecting a different category, or clearing active filters.
          </p>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Clear All Filters
            </button>
          )}
        </div>
      )}

      {/* Pagination Footer */}
      {products.length > 0 && (
        <div className="px-6 py-4 bg-white border border-slate-200 rounded-xl flex items-center justify-between text-xs text-slate-600 shadow-2xs">
          <div>
            Page <span className="font-mono font-semibold">{page}</span> of{' '}
            <span className="font-mono font-semibold">{totalPages || 1}</span> ({total} total products)
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
            >
              Previous
            </button>
            <span className="font-mono tabular-nums px-2">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1.5 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-2xs"
            >
              Next
            </button>
          </div>
        </div>
      )}

      {/* Cart Drawer Slide-Over */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        config={config || null}
        onCheckoutSuccess={(sale) => {
          fetchProducts();
          if (onSaleComplete) {
            onSaleComplete(sale);
          }
        }}
      />

      {/* Add / Edit Product Modal */}
      {isProductModalOpen && (
        <ProductModal
          product={editingProduct}
          categories={categories}
          onClose={() => setIsProductModalOpen(false)}
          onSuccess={() => {
            fetchProducts();
          }}
        />
      )}

      {/* Stock Adjustment Modal */}
      {adjustingProduct && (
        <StockAdjustmentModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSuccess={() => {
            fetchProducts();
          }}
        />
      )}
    </div>
  );
};
