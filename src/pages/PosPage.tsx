import React, { useState, useEffect } from 'react';
import { Product, Sale, StoreConfig } from '../types/index.ts';
import { api } from '../api/client.ts';
import { ProductImage } from '../components/ProductImage.tsx';
import {
  Search,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  CreditCard,
  Banknote,
  QrCode,
  FileCheck,
  AlertCircle
} from 'lucide-react';

interface CartItem {
  product: Product;
  quantity: number;
}

interface PosPageProps {
  config: StoreConfig | null;
  onSaleComplete: (sale: Sale) => void;
}

export const PosPage: React.FC<PosPageProps> = ({ config, onSaleComplete }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'CREDIT'>('CASH');
  const [notes, setNotes] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCatalog = async () => {
    try {
      const [prodRes, catRes] = await Promise.all([
        api.getProducts({ isActive: true, limit: 100 }),
        api.getCategories()
      ]);
      setProducts(prodRes.products);
      setCategories(catRes.categories);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch catalog');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  // Filter products for the picker
  const filteredProducts = products.filter((p) => {
    const matchesCat = selectedCategory === 'all' || p.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchesSearch =
      searchQuery.trim() === '' ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const addToCart = (product: Product) => {
    if (product.availableStock <= 0) return;

    setCart((prevCart) => {
      const existing = prevCart.find((it) => it.product._id === product._id);
      if (existing) {
        if (existing.quantity >= product.availableStock) {
          setError(`Cannot add more '${product.name}'. Max available stock is ${product.availableStock}.`);
          return prevCart;
        }
        return prevCart.map((it) =>
          it.product._id === product._id ? { ...it, quantity: it.quantity + 1 } : it
        );
      } else {
        return [...prevCart, { product, quantity: 1 }];
      }
    });
    setError(null);
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart((prevCart) => {
      return prevCart
        .map((it) => {
          if (it.product._id === productId) {
            const newQty = it.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > it.product.availableStock) {
              setError(`Max available stock for '${it.product.name}' is ${it.product.availableStock}.`);
              return it;
            }
            return { ...it, quantity: newQty };
          }
          return it;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prevCart) => prevCart.filter((it) => it.product._id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setError(null);
  };

  // Preview Calculations (The authoritative calculation is recomputed on backend upon submission)
  const currencySymbol = '₹';
  const taxRate = config?.taxRatePercent || 18;

  const subtotal = cart.reduce((acc, it) => acc + it.product.sellingPrice * it.quantity, 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const netAmount = Math.max(0, subtotal - discountAmount);
  const taxAmount = (netAmount * taxRate) / 100;
  const estimatedTotal = netAmount + taxAmount;

  const handleCheckout = async () => {
    if (cart.length === 0) return;
    setError(null);
    setSubmitting(true);

    try {
      const res = await api.createSale({
        items: cart.map((it) => ({
          productId: it.product._id,
          quantity: it.quantity
        })),
        discountPercent,
        paymentMethod,
        notes: notes.trim()
      });

      // Clear cart
      setCart([]);
      setNotes('');
      setDiscountPercent(0);

      // Re-fetch catalog to update available stock badges
      await fetchCatalog();

      // Trigger printable receipt modal
      onSaleComplete(res.sale);
    } catch (err: any) {
      setError(err.message || 'Sale checkout failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* Left 7 Columns: Product Selection & Catalog */}
      <div className="lg:col-span-7 space-y-4">
        {/* Search & Category Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search items by name or scan SKU barcode..."
              className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                selectedCategory === 'all'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Categories
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors font-medium ${
                  selectedCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Cards Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {filteredProducts.map((p) => {
            const inCartItem = cart.find((it) => it.product._id === p._id);
            const inCartQty = inCartItem?.quantity || 0;
            const remainingStock = p.availableStock - inCartQty;
            const isOutOfStock = p.availableStock <= 0;

            return (
              <div
                key={p._id}
                onClick={() => !isOutOfStock && remainingStock > 0 && addToCart(p)}
                className={`bg-white p-3 rounded-xl border transition-all text-left flex flex-col justify-between ${
                  isOutOfStock || remainingStock <= 0
                    ? 'border-slate-200 opacity-60 cursor-not-allowed bg-slate-50'
                    : 'border-slate-200 hover:border-slate-900 hover:shadow-sm cursor-pointer'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 text-[11px] text-slate-400 font-mono mb-2">
                    <span>{p.sku}</span>
                    <span
                      className={`font-mono font-medium ${
                        p.availableStock === 0
                          ? 'text-rose-600'
                          : p.availableStock <= p.reorderLevel
                          ? 'text-amber-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {remainingStock} {p.unit || 'pcs'} left
                    </span>
                  </div>

                  <div className="flex gap-2.5 items-start">
                    <div className="w-12 h-12 rounded-lg overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                      <ProductImage
                        src={p.imageUrl}
                        alt={p.name}
                        size="sm"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-slate-900 text-xs line-clamp-2 leading-tight">
                        {p.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5 truncate">{p.category}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
                    {currencySymbol}{p.sellingPrice.toFixed(2)}
                  </span>

                  <button
                    disabled={isOutOfStock || remainingStock <= 0}
                    className="p-1 rounded bg-slate-100 hover:bg-slate-900 hover:text-white text-slate-700 transition-colors disabled:opacity-40"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredProducts.length === 0 && !loading && (
          <div className="bg-white p-8 rounded-xl border border-slate-200 text-center text-xs text-slate-400">
            No products matching "{searchQuery}".
          </div>
        )}
      </div>

      {/* Right 5 Columns: Cart & Authoritative Checkout */}
      <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        {/* Cart Header */}
        <div className="px-5 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4 text-slate-700" />
            <h3 className="font-semibold text-slate-900 text-sm">Customer Order Cart</h3>
            <span className="text-xs text-slate-500 font-mono tabular-nums">({cart.length} items)</span>
          </div>
          {cart.length > 0 && (
            <button
              onClick={clearCart}
              className="text-xs font-medium text-slate-400 hover:text-rose-600 transition-colors"
            >
              Clear Cart
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Cart Line Items */}
        <div className="p-4 overflow-y-auto max-h-[380px] divide-y divide-slate-100 flex-1">
          {cart.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <ShoppingCart className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <span>Cart is empty. Select items from the catalog.</span>
            </div>
          ) : (
            cart.map((it) => (
              <div key={it.product._id} className="py-3 flex items-center justify-between gap-3 text-xs">
                <div className="w-8 h-8 rounded-md overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                  <ProductImage
                    src={it.product.imageUrl}
                    alt={it.product.name}
                    size="sm"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-900 truncate">{it.product.name}</div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    {currencySymbol}{it.product.sellingPrice.toFixed(2)} / {it.product.unit || 'pcs'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-200 rounded-lg">
                    <button
                      onClick={() => updateQuantity(it.product._id, -1)}
                      className="p-1 text-slate-600 hover:bg-slate-100 transition-colors rounded-l-md"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="px-2 font-mono font-medium text-slate-900 tabular-nums">
                      {it.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(it.product._id, 1)}
                      className="p-1 text-slate-600 hover:bg-slate-100 transition-colors rounded-r-md"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-mono font-semibold text-slate-900 w-16 text-right tabular-nums">
                    {currencySymbol}{(it.product.sellingPrice * it.quantity).toFixed(2)}
                  </span>

                  <button
                    onClick={() => removeFromCart(it.product._id)}
                    className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Fiscal Checkout Summary */}
        {cart.length > 0 && (
          <div className="p-5 border-t border-slate-200 bg-slate-50/50 space-y-3 text-xs">
            {/* Discount selector */}
            <div className="flex items-center justify-between gap-4">
              <label className="text-slate-600 font-medium">Apply Discount (%):</label>
              <div className="flex items-center gap-1">
                {[0, 5, 10, 15].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDiscountPercent(d)}
                    className={`px-2 py-1 rounded text-xs font-mono font-medium transition-colors ${
                      discountPercent === d
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {d}%
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div>
              <label className="text-slate-600 font-medium block mb-1.5">Payment Method:</label>
              <div className="grid grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    paymentMethod === 'CASH'
                      ? 'border-slate-900 bg-slate-900 text-white font-medium'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <Banknote className="w-3 h-3" />
                  <span>Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    paymentMethod === 'CARD'
                      ? 'border-slate-900 bg-slate-900 text-white font-medium'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-3 h-3" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    paymentMethod === 'UPI'
                      ? 'border-slate-900 bg-slate-900 text-white font-medium'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <QrCode className="w-3 h-3" />
                  <span>UPI</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('CREDIT')}
                  className={`py-1.5 px-2 rounded-lg border text-center transition-colors flex items-center justify-center gap-1 ${
                    paymentMethod === 'CREDIT'
                      ? 'border-slate-900 bg-slate-900 text-white font-medium'
                      : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <FileCheck className="w-3 h-3" />
                  <span>Credit</span>
                </button>
              </div>
            </div>

            {/* Calculations Breakdown */}
            <div className="space-y-1 pt-2 border-t border-slate-200 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span className="font-mono tabular-nums">{currencySymbol}{subtotal.toFixed(2)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-700">
                  <span>Discount ({discountPercent}%):</span>
                  <span className="font-mono tabular-nums">-{currencySymbol}{discountAmount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>GST ({taxRate}%):</span>
                <span className="font-mono tabular-nums">+{currencySymbol}{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-300">
                <span>Total Due:</span>
                <span className="font-mono tabular-nums">{currencySymbol}{estimatedTotal.toFixed(2)}</span>
              </div>
            </div>

            {/* Notes / Reference */}
            <div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional customer name or sale notes..."
                className="w-full px-3 py-1.5 border border-slate-300 rounded-lg text-xs focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {/* Complete Sale Action */}
            <button
              onClick={handleCheckout}
              disabled={submitting || cart.length === 0}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <span>{submitting ? 'Committing Sale...' : 'Charge ' + currencySymbol + estimatedTotal.toFixed(2)}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
