import React, { useState } from 'react';
import { Product, Sale, StoreConfig } from '../types/index.ts';
import { api } from '../api/client.ts';
import { ProductImage } from './ProductImage.tsx';
import { useCustomerAuth } from '../context/CustomerAuthContext.tsx';
import {
  X,
  Plus,
  Minus,
  Trash2,
  ShoppingCart,
  Banknote,
  CreditCard,
  QrCode,
  FileCheck,
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  User,
  Phone,
  LogIn
} from 'lucide-react';

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onClearCart: () => void;
  config: StoreConfig | null;
  onCheckoutSuccess: (sale: Sale) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  config,
  onCheckoutSuccess
}) => {
  const { customer, openAuthModal } = useCustomerAuth();
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'UPI' | 'CREDIT'>('UPI');
  const [customerName, setCustomerName] = useState<string>(customer?.fullName || '');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Sync customer name when customer state updates
  React.useEffect(() => {
    if (customer && !customerName) {
      setCustomerName(customer.fullName);
    }
  }, [customer]);

  if (!isOpen) return null;

  const currencySymbol = '₹';
  const taxRate = config?.taxRatePercent || 18;

  const subtotal = cart.reduce((acc, it) => acc + it.product.sellingPrice * it.quantity, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const estimatedTotal = subtotal + taxAmount;

  const totalItemsCount = cart.reduce((acc, it) => acc + it.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) return;

    if (!customer) {
      onClose();
      openAuthModal('login');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const res = await api.createSale({
        items: cart.map((it) => ({
          productId: it.product._id,
          quantity: it.quantity
        })),
        paymentMethod,
        notes: notes.trim(),
        customerName: customerName.trim() || customer.fullName,
        customerPhone: customerPhone.trim() || undefined
      });

      // Save to customer order history in localStorage as backup
      try {
        const stored = JSON.parse(localStorage.getItem('retailflow_customer_orders') || '[]');
        stored.unshift(res.sale);
        localStorage.setItem('retailflow_customer_orders', JSON.stringify(stored.slice(0, 50)));
      } catch (_e) {
        // ignore
      }

      onClearCart();
      setNotes('');
      setCustomerPhone('');
      onClose();
      onCheckoutSuccess(res.sale);
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please verify quantities.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-stone-950/50 backdrop-blur-xs transition-opacity duration-300"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col border-l border-stone-200">
          {/* Drawer Header */}
          <div className="px-6 py-4 bg-[#042017] text-white border-b border-[#083829] flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-lime-400 flex items-center justify-center border border-emerald-400/30">
                <ShoppingCart className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Shopping Basket</h3>
                <p className="text-[11px] text-emerald-300/80 font-mono">
                  {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'} in order
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {cart.length > 0 && (
                <button
                  onClick={onClearCart}
                  className="text-xs text-stone-300 hover:text-rose-400 transition-colors px-2 py-1 font-medium"
                >
                  Clear
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-stone-300 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border-b border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span className="font-medium">{error}</span>
            </div>
          )}

          {/* Cart Item List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 divide-y divide-stone-100">
            {cart.length === 0 ? (
              <div className="py-24 text-center text-stone-400">
                <ShoppingCart className="w-12 h-12 mx-auto stroke-1 text-stone-300 mb-3" />
                <h4 className="text-sm font-bold text-stone-700">Your basket is empty</h4>
                <p className="text-xs text-stone-500 mt-1 max-w-xs mx-auto">
                  Browse the catalog and add products to start your order.
                </p>
                <button
                  onClick={onClose}
                  className="mt-6 px-5 py-2.5 bg-[#064e3b] text-white text-xs font-bold rounded-xl hover:bg-[#043d2e] transition-colors shadow-xs"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              cart.map((it) => (
                <div key={it.product._id} className="pt-4 first:pt-0 flex gap-3.5 items-center text-xs">
                  {/* Item Image */}
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-[#f5f5f3] border border-stone-200 shrink-0">
                    <ProductImage
                      src={it.product.imageUrl}
                      alt={it.product.name}
                      size="sm"
                      category={it.product.category}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Item Details */}
                  <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-stone-900 truncate leading-tight">
                      {it.product.name}
                    </h5>
                    <div className="text-[11px] text-stone-500 font-mono mt-0.5">
                      {currencySymbol}{it.product.sellingPrice.toFixed(2)} / {it.product.unit || 'pcs'}
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      {/* Quantity Stepper */}
                      <div className="flex items-center border border-stone-300 rounded-lg bg-stone-50 overflow-hidden shadow-2xs">
                        <button
                          onClick={() => onUpdateQuantity(it.product._id, -1)}
                          className="px-2 py-1 text-stone-700 hover:bg-stone-200 transition-colors font-bold"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="px-2 font-mono font-bold text-stone-900 tabular-nums">
                          {it.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateQuantity(it.product._id, 1)}
                          disabled={it.quantity >= it.product.availableStock}
                          className="px-2 py-1 text-stone-700 hover:bg-stone-200 transition-colors font-bold disabled:opacity-30"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-mono font-extrabold text-stone-900 tabular-nums">
                          {currencySymbol}{(it.product.sellingPrice * it.quantity).toFixed(2)}
                        </span>
                        <button
                          onClick={() => onRemoveItem(it.product._id)}
                          className="p-1 text-stone-400 hover:text-rose-600 transition-colors"
                          title="Remove item"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Drawer Footer & Checkout */}
          {cart.length > 0 && (
            <div className="p-6 bg-[#faf9f6] border-t border-stone-200 space-y-4 shrink-0 text-xs">
              {/* Customer Details for Order & Receipt */}
              <div className="space-y-2">
                <span className="text-stone-700 font-semibold block text-xs">
                  Customer Information for Receipt:
                </span>
                {customer ? (
                  <div className="p-2.5 bg-emerald-50/80 rounded-xl border border-emerald-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-bold text-xs">
                        {customer.fullName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-bold text-stone-900 text-xs flex items-center gap-1">
                          <span>{customer.fullName}</span>
                          <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                        </div>
                        <div className="text-[10px] text-stone-500 font-mono">{customer.email}</div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                      Verified
                    </span>
                  </div>
                ) : (
                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span>Account required to checkout</span>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        openAuthModal('login');
                      }}
                      className="px-2.5 py-1 bg-[#064e3b] text-white rounded-lg font-semibold text-[11px] cursor-pointer"
                    >
                      Sign In
                    </button>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-stone-400">
                      <User className="w-3 h-3" />
                    </span>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Your Name"
                      className="w-full pl-7 pr-2.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden bg-white text-stone-900"
                    />
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-stone-400">
                      <Phone className="w-3 h-3" />
                    </span>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Phone (optional)"
                      className="w-full pl-7 pr-2.5 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden bg-white text-stone-900"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <span className="text-stone-700 font-semibold block mb-1.5 text-xs">
                  Select Payment Method:
                </span>
                <div className="grid grid-cols-4 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`py-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1 text-[11px] font-semibold ${
                      paymentMethod === 'CASH'
                        ? 'border-[#064e3b] bg-[#064e3b] text-white shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <Banknote className="w-3.5 h-3.5" />
                    <span>Cash</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CARD')}
                    className={`py-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1 text-[11px] font-semibold ${
                      paymentMethod === 'CARD'
                        ? 'border-[#064e3b] bg-[#064e3b] text-white shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('UPI')}
                    className={`py-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1 text-[11px] font-semibold ${
                      paymentMethod === 'UPI'
                        ? 'border-[#064e3b] bg-[#064e3b] text-white shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5" />
                    <span>UPI</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CREDIT')}
                    className={`py-2 rounded-xl border text-center transition-all flex items-center justify-center gap-1 text-[11px] font-semibold ${
                      paymentMethod === 'CREDIT'
                        ? 'border-[#064e3b] bg-[#064e3b] text-white shadow-2xs'
                        : 'border-stone-200 bg-white hover:bg-stone-50 text-stone-700'
                    }`}
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Credit</span>
                  </button>
                </div>
              </div>

              {/* Subtotal & Taxes breakdown */}
              <div className="space-y-1.5 pt-2.5 border-t border-stone-200 text-stone-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span className="font-mono font-medium tabular-nums">{currencySymbol}{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST ({taxRate}%):</span>
                  <span className="font-mono font-medium tabular-nums">+{currencySymbol}{taxAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-base font-extrabold text-stone-950 pt-2 border-t border-stone-300">
                  <span>Total Payable:</span>
                  <span className="font-mono tabular-nums text-lg text-[#064e3b]">
                    {currencySymbol}{estimatedTotal.toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Authoritative Checkout Button */}
              <button
                onClick={handleCheckout}
                disabled={submitting || cart.length === 0}
                className="w-full py-3.5 px-4 bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs rounded-xl transition-all shadow-sm disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
              >
                <span>
                  {submitting ? 'Submitting to Authoritative Sales Engine...' : `Place Order · ${currencySymbol}${estimatedTotal.toFixed(2)}`}
                </span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
