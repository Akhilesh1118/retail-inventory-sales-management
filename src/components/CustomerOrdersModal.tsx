import React, { useState, useEffect } from 'react';
import { Sale, StoreConfig } from '../types/index.ts';
import { api } from '../api/client.ts';
import { useCustomerAuth } from '../context/CustomerAuthContext.tsx';
import { PrintInvoiceModal } from './PrintInvoiceModal.tsx';
import {
  X,
  Receipt,
  Search,
  Calendar,
  CreditCard,
  Eye,
  ShoppingBag,
  ExternalLink,
  Clock,
  LogIn
} from 'lucide-react';

interface CustomerOrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: StoreConfig | null;
}

export const CustomerOrdersModal: React.FC<CustomerOrdersModalProps> = ({
  isOpen,
  onClose,
  config
}) => {
  const { customer, openAuthModal } = useCustomerAuth();
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [searchInvoice, setSearchInvoice] = useState<string>('');
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [lookupLoading, setLookupLoading] = useState<boolean>(false);
  const [lookupError, setLookupError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (customer) {
        setLoading(true);
        api
          .getCustomerOrders()
          .then((res) => {
            setOrders(res.orders);
          })
          .catch((err) => {
            console.error('Failed to fetch customer orders:', err);
          })
          .finally(() => setLoading(false));
      } else {
        try {
          const stored = JSON.parse(localStorage.getItem('retailflow_customer_orders') || '[]');
          if (Array.isArray(stored)) {
            setOrders(stored);
          }
        } catch (_e) {
          setOrders([]);
        }
      }
    }
  }, [isOpen, customer]);

  if (!isOpen) return null;

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInvoice.trim()) return;

    setLookupLoading(true);
    setLookupError(null);

    try {
      const cleaned = searchInvoice.trim().toUpperCase();
      const localMatch = orders.find(
        (o) => o.invoiceNumber.toUpperCase() === cleaned || o._id.toUpperCase() === cleaned
      );

      if (localMatch) {
        setSelectedSale(localMatch);
        setLookupLoading(false);
        return;
      }

      const res = await api.getSale(searchInvoice.trim());
      if (res.sale) {
        setSelectedSale(res.sale);
      } else {
        setLookupError(`Invoice '${searchInvoice}' not found.`);
      }
    } catch (err: any) {
      setLookupError(err.message || `No invoice found for '${searchInvoice}'.`);
    } finally {
      setLookupLoading(false);
    }
  };

  const currencySymbol = '₹';

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="px-6 py-4 bg-[#042017] text-white border-b border-[#083829] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-lime-400 border border-emerald-400/30 flex items-center justify-center shadow-xs">
                <Receipt className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Customer Orders & Receipts</h3>
                <p className="text-[11px] text-emerald-300/80">
                  Track your previous purchases and view itemized GST tax invoices
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-stone-300 hover:text-white rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Invoice Lookup Form */}
          <div className="p-6 bg-[#faf9f6] border-b border-stone-200">
            <form onSubmit={handleLookup} className="flex gap-2">
              <div className="relative flex-1">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-stone-400">
                  <Search className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={searchInvoice}
                  onChange={(e) => setSearchInvoice(e.target.value)}
                  placeholder="Enter Invoice / Order ID (e.g. INV-20261016-0001)..."
                  className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-stone-300 rounded-xl text-xs text-stone-900 focus:ring-2 focus:ring-[#064e3b] focus:outline-hidden"
                />
              </div>
              <button
                type="submit"
                disabled={lookupLoading || !searchInvoice.trim()}
                className="px-5 py-2.5 bg-[#064e3b] hover:bg-[#043d2e] disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shrink-0 shadow-xs"
              >
                {lookupLoading ? 'Searching...' : 'Find Receipt'}
              </button>
            </form>

            {lookupError && (
              <p className="text-xs text-rose-600 mt-2 font-medium">{lookupError}</p>
            )}
          </div>

          {/* Orders List */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3">
            {!customer && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-900 mb-3">
                <div className="flex items-center gap-2">
                  <LogIn className="w-4 h-4 text-[#064e3b] shrink-0" />
                  <span>Sign in to sync and view your full order history across all devices.</span>
                </div>
                <button
                  onClick={() => {
                    onClose();
                    openAuthModal('login');
                  }}
                  className="px-2.5 py-1 bg-[#064e3b] hover:bg-[#043d2e] text-white rounded-lg font-semibold text-[11px] shrink-0 transition"
                >
                  Sign In
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs text-stone-500 pb-1">
              <span className="font-bold text-stone-700 uppercase tracking-wider text-[10px] font-mono">
                {customer ? `Orders for ${customer.fullName} (${orders.length})` : `Recent Orders (${orders.length})`}
              </span>
              <span className="text-[11px] text-stone-400">
                {customer ? 'Verified customer history' : 'Stored on this browser'}
              </span>
            </div>

            {loading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
                <div className="w-5 h-5 border-2 border-[#064e3b] border-t-transparent rounded-full animate-spin" />
                <span className="text-xs">Loading orders...</span>
              </div>
            ) : orders.length === 0 ? (
              <div className="py-16 text-center text-stone-400">
                <ShoppingBag className="w-10 h-10 mx-auto text-stone-300 stroke-1 mb-2" />
                <h5 className="text-xs font-bold text-stone-700">No orders placed yet</h5>
                <p className="text-[11px] text-stone-400 mt-1 max-w-xs mx-auto">
                  When you check out items from your cart, your order receipt will appear here for easy reference and printing.
                </p>
              </div>
            ) : (
              orders.map((ord) => (
                <div
                  key={ord._id}
                  className="p-4 rounded-xl border border-stone-200 bg-white hover:border-[#064e3b]/40 hover:shadow-2xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-stone-950 text-xs">
                        {ord.invoiceNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          ord.status === 'COMPLETED'
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <div className="text-[11px] text-stone-500 flex flex-wrap items-center gap-x-3 gap-y-1">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-stone-400" />
                        {new Date(ord.createdAt).toLocaleDateString()} at{' '}
                        {new Date(ord.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span>·</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="w-3 h-3 text-stone-400" />
                        {ord.paymentMethod}
                      </span>
                      <span>·</span>
                      <span>{ord.items.length} {ord.items.length === 1 ? 'item' : 'items'}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                    <div className="text-right sm:text-right">
                      <div className="text-[10px] text-stone-400 uppercase font-mono font-semibold">
                        Paid Total
                      </div>
                      <div className="font-mono font-extrabold text-sm text-[#064e3b] tabular-nums">
                        {currencySymbol}{ord.totalAmount.toFixed(2)}
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedSale(ord)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-lg transition-colors shadow-2xs"
                    >
                      <Eye className="w-3.5 h-3.5 text-stone-600" />
                      <span>View Receipt</span>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 bg-[#faf9f6] border-t border-stone-200 flex justify-between items-center text-[11px] text-stone-500">
            <span>Customer Self-Service · {config?.storeName || 'Apex Retail Mart'}</span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Modal for receipt inspection/printing */}
      {selectedSale && (
        <PrintInvoiceModal
          sale={selectedSale}
          config={config}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </>
  );
};
