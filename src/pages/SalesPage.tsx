import React, { useState, useEffect } from 'react';
import { Sale, StoreConfig } from '../types/index.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { PrintInvoiceModal } from '../components/PrintInvoiceModal.tsx';
import {
  Search,
  Printer,
  RotateCcw,
  Download,
  Receipt,
  Eye,
  Filter
} from 'lucide-react';

interface SalesPageProps {
  config: StoreConfig | null;
}

export const SalesPage: React.FC<SalesPageProps> = ({ config }) => {
  const { isAdmin } = useAuth();

  const [sales, setSales] = useState<Sale[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Modal
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  const fetchSales = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getSales({
        search,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 15
      });
      setSales(res.sales);
      setTotal(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch sales history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [search, statusFilter, startDate, endDate, page]);

  const handleReturnSale = async (sale: Sale) => {
    if (sale.status === 'RETURNED') {
      alert('This sale has already been processed as returned.');
      return;
    }

    const reason = window.prompt(
      `Process return for Invoice ${sale.invoiceNumber}?\nAll line items (${sale.items.length} items) will be restored to store inventory.\n\nPlease enter the return reason:`
    );

    if (!reason || reason.trim() === '') return;

    try {
      await api.returnSale(sale._id, reason.trim());
      alert(`Sale ${sale.invoiceNumber} returned successfully. Inventory stock has been restored.`);
      await fetchSales();
    } catch (err: any) {
      alert(err.message || 'Failed to process sales return');
    }
  };

  const handleExportCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      await api.downloadCsv('/api/reports/export/sales.csv', 'sales_report.csv');
    } catch (err: any) {
      const message = err.message || 'Failed to export the sales report.';
      setError(message);
      if (err.status === 401) window.alert('Your session has expired. Please sign in again to export this report.');
    } finally {
      setExporting(false);
    }
  };

  const currencySymbol = '₹';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Sales & Invoices</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit historical register transactions, print tax receipts, or manage returns
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCsv}
          disabled={exporting}
          className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-xs self-start sm:self-auto disabled:cursor-wait disabled:opacity-60"
        >
          <Download className="w-3.5 h-3.5" />
          <span>{exporting ? 'Preparing CSV…' : 'Export Sales CSV'}</span>
        </button>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
          {/* Search by Invoice #, Cashier, Item */}
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
              placeholder="Search by invoice number, cashier, item name..."
              className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            >
              <option value="all">All Statuses</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="RETURNED">RETURNED</option>
            </select>
          </div>

          {/* Date Range: From */}
          <div className="sm:col-span-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Date Range: To */}
          <div className="sm:col-span-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-left font-medium">
                <th className="py-3 px-4">Invoice #</th>
                <th className="py-3 px-4">Date & Time</th>
                <th className="py-3 px-4">Cashier</th>
                <th className="py-3 px-4 text-center">Items</th>
                <th className="py-3 px-4 text-right">Subtotal</th>
                <th className="py-3 px-4 text-right">Tax (GST)</th>
                <th className="py-3 px-4 text-right">Grand Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.map((s) => {
                const totalUnits = s.items.reduce((acc, it) => acc + it.quantity, 0);

                return (
                  <tr key={s._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900 whitespace-nowrap">
                      {s.invoiceNumber}
                    </td>

                    <td className="py-3.5 px-4 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(s.createdAt).toLocaleString('en-IN', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })}
                    </td>

                    <td className="py-3.5 px-4 text-slate-800 whitespace-nowrap">
                      {s.userName}
                    </td>

                    <td className="py-3.5 px-4 text-center font-mono text-slate-600 whitespace-nowrap tabular-nums">
                      {s.items.length} ({totalUnits} pcs)
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {currencySymbol}{s.subtotal.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-600 whitespace-nowrap">
                      {currencySymbol}{s.taxAmount.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-slate-900 whitespace-nowrap">
                      {currencySymbol}{s.totalAmount.toFixed(2)}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`font-mono text-[11px] font-semibold ${
                          s.status === 'COMPLETED' ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {s.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSale(s)}
                          title="View / Print Tax Invoice"
                          className="px-2.5 py-1 text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors inline-flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View</span>
                        </button>

                        {/* Return Workflow (Bonus) */}
                        {s.status === 'COMPLETED' && (
                          <button
                            onClick={() => handleReturnSale(s)}
                            title="Process Return & Restock Inventory"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
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

        {sales.length === 0 && !loading && (
          <div className="p-12 text-center text-xs text-slate-400">
            No sales orders found matching your search.
          </div>
        )}

        {/* Pagination Footer */}
        <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div>
            Showing <span className="font-mono font-medium">{sales.length}</span> of{' '}
            <span className="font-mono font-medium">{total}</span> invoices
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              Previous
            </button>
            <span className="font-mono tabular-nums">
              {page} / {totalPages || 1}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Details / Print Modal */}
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
