import React, { useState, useEffect } from 'react';
import { useCustomerAuth } from '../context/CustomerAuthContext.tsx';
import { Sale, StoreConfig } from '../types/index.ts';
import { api } from '../api/client.ts';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal.tsx';
import {
  ArrowLeft,
  User,
  Mail,
  Calendar,
  Package,
  Receipt,
  LogOut,
  ShoppingBag,
  Clock,
  Printer,
  ChevronRight,
  ShieldCheck,
  Sparkles
} from 'lucide-react';

interface CustomerAccountPageProps {
  config: StoreConfig | null;
  onBackToStore: () => void;
  onOpenStaffPortal?: () => void;
}

export const CustomerAccountPage: React.FC<CustomerAccountPageProps> = ({
  config,
  onBackToStore,
  onOpenStaffPortal
}) => {
  const { customer, logout, openAuthModal } = useCustomerAuth();
  const [orders, setOrders] = useState<Sale[]>([]);
  const [loadingOrders, setLoadingOrders] = useState<boolean>(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchOrders = async () => {
    if (!customer) {
      setLoadingOrders(false);
      return;
    }
    setLoadingOrders(true);
    try {
      const res = await api.getCustomerOrders();
      setOrders(res.orders);
    } catch (err) {
      console.error('Failed to load customer orders:', err);
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [customer]);

  if (!customer) {
    return (
      <div className="min-h-screen bg-[#faf9f6] flex flex-col items-center justify-center p-6 text-stone-900">
        <div className="max-w-md w-full bg-white rounded-2xl border border-stone-200 p-8 shadow-sm text-center">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#064e3b] flex items-center justify-center mx-auto mb-4 border border-emerald-100">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Customer Account Access</h2>
          <p className="text-xs text-stone-500 mb-6 leading-relaxed">
            Please sign in to view your profile details, past invoices, and active orders.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => openAuthModal('login')}
              className="w-full py-2.5 px-4 rounded-xl font-semibold text-sm bg-[#064e3b] hover:bg-[#062c20] text-white transition shadow cursor-pointer"
            >
              Sign In to Your Account
            </button>
            <button
              onClick={onBackToStore}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition cursor-pointer"
            >
              Return to Catalog
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#faf9f6] text-stone-900 flex flex-col font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <button
            onClick={onBackToStore}
            className="inline-flex items-center gap-2 text-xs font-semibold text-stone-700 hover:text-[#064e3b] py-2 px-3 rounded-xl hover:bg-stone-100/80 transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Storefront</span>
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#064e3b] text-white flex items-center justify-center font-bold text-sm shadow-sm">
              {config?.storeName?.charAt(0) || 'A'}
            </div>
            <span className="font-extrabold text-stone-900 text-sm tracking-tight hidden sm:inline">
              {config?.storeName || 'Apex Retail Mart'}
            </span>
          </div>

          <button
            onClick={async () => {
              await logout();
              onBackToStore();
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-stone-500 hover:text-red-600 py-1.5 px-3 rounded-lg hover:bg-red-50 transition cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Customer Profile Card */}
          <div className="lg:col-span-1 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="flex items-center gap-3.5 pb-5 border-b border-stone-100">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-[#064e3b] font-bold text-lg">
                  {customer.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-base font-bold text-stone-900 truncate">
                    {customer.fullName}
                  </h2>
                  <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold mt-0.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#10b981]" />
                    <span>Verified Customer Account</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex items-center gap-2 text-stone-600">
                  <Mail className="w-4 h-4 text-stone-400 shrink-0" />
                  <span className="truncate">{customer.email}</span>
                </div>
                {customer.createdAt && (
                  <div className="flex items-center gap-2 text-stone-600">
                    <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
                    <span>
                      Customer since {new Date(customer.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-stone-600">
                  <Package className="w-4 h-4 text-stone-400 shrink-0" />
                  <span>
                    Total orders placed: <strong>{orders.length}</strong>
                  </span>
                </div>
              </div>

              <div className="mt-6 pt-5 border-t border-stone-100">
                <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 text-[11px] text-stone-500 leading-relaxed">
                  <div className="font-semibold text-stone-700 mb-0.5">Customer Privacy</div>
                  Your order history and invoices are encrypted and restricted to your authenticated
                  session.
                </div>
              </div>
            </div>

            {/* Employee Portal Link (Discrete for dual use) */}
            {onOpenStaffPortal && (
              <div className="text-center pt-2">
                <button
                  onClick={onOpenStaffPortal}
                  className="text-[11px] text-stone-400 hover:text-stone-700 underline transition cursor-pointer"
                >
                  Store Staff & Administration Portal
                </button>
              </div>
            )}
          </div>

          {/* Orders History List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-bold text-stone-900 tracking-tight flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-[#064e3b]" />
                    <span>My Orders & Invoices</span>
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    View digital receipts and itemized order breakdowns
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-stone-100 text-stone-700">
                  {orders.length} {orders.length === 1 ? 'order' : 'orders'}
                </span>
              </div>

              {loadingOrders ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-stone-400">
                  <div className="w-6 h-6 border-2 border-[#064e3b] border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">Loading your order history...</span>
                </div>
              ) : orders.length === 0 ? (
                <div className="py-12 text-center border-2 border-dashed border-stone-200 rounded-2xl p-8">
                  <div className="w-12 h-12 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto mb-3">
                    <ShoppingBag className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-stone-800">No orders placed yet</h4>
                  <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto mb-4">
                    Items you purchase from our storefront catalog will be automatically linked here
                    with downloadable GST tax invoices.
                  </p>
                  <button
                    onClick={onBackToStore}
                    className="py-2 px-4 rounded-xl text-xs font-semibold bg-[#064e3b] hover:bg-[#062c20] text-white shadow transition cursor-pointer"
                  >
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((sale) => (
                    <div
                      key={sale._id}
                      className="border border-stone-200 rounded-xl p-4 sm:p-5 hover:border-emerald-300 transition-all bg-white"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-stone-100">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#064e3b] flex items-center justify-center shrink-0">
                            <Receipt className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-stone-900 text-xs sm:text-sm">
                                {sale.invoiceNumber}
                              </span>
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                                  sale.status === 'COMPLETED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                }`}
                              >
                                {sale.status}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-stone-500 mt-0.5">
                              <Clock className="w-3 h-3 text-stone-400" />
                              <span>{new Date(sale.createdAt).toLocaleString()}</span>
                              <span>·</span>
                              <span className="uppercase">{sale.paymentMethod}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center sm:flex-col sm:items-end justify-between sm:justify-center">
                          <span className="text-[11px] text-stone-400 sm:text-right">Total Paid</span>
                          <span className="text-base font-extrabold text-[#064e3b] font-mono">
                            ₹{sale.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      {/* Items list */}
                      <div className="py-3 space-y-1.5 text-xs text-stone-700">
                        {sale.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 text-stone-400 font-mono text-[11px]">
                                {it.quantity}×
                              </span>
                              <span className="font-medium text-stone-800 truncate">{it.name}</span>
                              <span className="font-mono text-[10px] text-stone-400 hidden sm:inline">
                                ({it.sku})
                              </span>
                            </div>
                            <div className="font-mono text-stone-700 font-semibold shrink-0">
                              ₹{it.lineTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Footer Actions */}
                      <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
                        <div className="text-[11px] text-stone-500">
                          {sale.taxAmount > 0 && (
                            <span>Incl. GST: ₹{sale.taxAmount.toFixed(2)}</span>
                          )}
                        </div>
                        <button
                          onClick={() => setSelectedSale(sale)}
                          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#064e3b] hover:text-[#062c20] bg-emerald-50/80 hover:bg-emerald-100/80 py-1.5 px-3 rounded-lg transition cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>View / Print Invoice</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Printable Invoice Modal */}
      {selectedSale && (
        <PrintInvoiceModal
          sale={selectedSale}
          config={config}
          onClose={() => setSelectedSale(null)}
        />
      )}
    </div>
  );
};
