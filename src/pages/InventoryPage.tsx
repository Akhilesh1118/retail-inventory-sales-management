import React, { useState, useEffect } from 'react';
import { Product, InventoryMovement, MovementType } from '../types/index.ts';
import { api } from '../api/client.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { StockAdjustmentModal } from '../components/StockAdjustmentModal.tsx';
import {
  AlertTriangle,
  PackageCheck,
  History,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Search
} from 'lucide-react';

export const InventoryPage: React.FC = () => {
  const { isAdmin } = useAuth();

  const [activeSubTab, setActiveSubTab] = useState<'movements' | 'lowstock'>('movements');

  // Movements state
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [totalMovements, setTotalMovements] = useState<number>(0);
  const [movementPage, setMovementPage] = useState<number>(1);
  const [movementPages, setMovementPages] = useState<number>(1);
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Low stock state
  const [lowStockData, setLowStockData] = useState<{
    summary: { totalAlerts: number; outOfStockCount: number; lowStockCount: number };
    products: Product[];
  } | null>(null);

  // Modal
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [exporting, setExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMovements = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getMovements({
        type: typeFilter !== 'all' ? typeFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page: movementPage,
        limit: 20
      });
      setMovements(res.movements);
      setTotalMovements(res.total);
      setMovementPages(res.totalPages);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch inventory movements');
    } finally {
      setLoading(false);
    }
  };

  const fetchLowStock = async () => {
    try {
      const res = await api.getLowStock();
      setLowStockData(res);
    } catch (err: any) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeSubTab === 'movements') {
      fetchMovements();
    } else {
      fetchLowStock();
    }
  }, [activeSubTab, typeFilter, startDate, endDate, movementPage]);

  // Initial load
  useEffect(() => {
    fetchLowStock();
  }, []);

  const handleExportInventoryCsv = async () => {
    setExporting(true);
    setError(null);
    try {
      await api.downloadCsv('/api/reports/export/inventory.csv', 'inventory_valuation.csv');
    } catch (err: any) {
      const message = err.message || 'Failed to export the inventory report.';
      setError(message);
      if (err.status === 401) window.alert('Your session has expired. Please sign in again to export this report.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Inventory & Audit Log</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Traceable stock adjustments, inbound vendor receipts, and threshold alerts
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Sub-view switcher */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg text-xs">
            <button
              onClick={() => setActiveSubTab('movements')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors ${
                activeSubTab === 'movements'
                  ? 'bg-white text-slate-950 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Movement History
            </button>
            <button
              onClick={() => setActiveSubTab('lowstock')}
              className={`px-3 py-1.5 font-medium rounded-md transition-colors flex items-center gap-1.5 ${
                activeSubTab === 'lowstock'
                  ? 'bg-white text-slate-950 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <span>Low-Stock Alerts</span>
              {lowStockData && lowStockData.summary.totalAlerts > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-mono font-bold">
                  {lowStockData.summary.totalAlerts}
                </span>
              )}
            </button>
          </div>

          <button
            onClick={handleExportInventoryCsv}
            disabled={exporting}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-xs disabled:cursor-wait disabled:opacity-60"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{exporting ? 'Preparing CSV…' : 'Export Inventory CSV'}</span>
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* VIEW 1: Movement History */}
      {activeSubTab === 'movements' && (
        <div className="space-y-4">
          {/* Movement Filters Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">Type:</span>
              <select
                value={typeFilter}
                onChange={(e) => {
                  setTypeFilter(e.target.value);
                  setMovementPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              >
                <option value="all">All Movement Types</option>
                <option value="STOCK_RECEIVED">STOCK_RECEIVED (Shipment)</option>
                <option value="MANUAL_INCREASE">MANUAL_INCREASE (Correction)</option>
                <option value="MANUAL_DECREASE">MANUAL_DECREASE (Writeoff)</option>
                <option value="SALE">SALE (Order Deduction)</option>
                <option value="SALE_RETURN">SALE_RETURN (Restock)</option>
              </select>
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">From:</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setMovementPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>

            <div className="flex items-center gap-1">
              <span className="text-slate-500 font-medium">To:</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setMovementPage(1);
                }}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
              />
            </div>

            {(typeFilter !== 'all' || startDate || endDate) && (
              <button
                onClick={() => {
                  setTypeFilter('all');
                  setStartDate('');
                  setEndDate('');
                  setMovementPage(1);
                }}
                className="px-2 py-1 text-slate-500 hover:text-slate-900 underline"
              >
                Clear filters
              </button>
            )}
          </div>

          {/* Movements Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-left font-medium">
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Product & SKU</th>
                    <th className="py-3 px-4">Movement Type</th>
                    <th className="py-3 px-4 text-center">Change</th>
                    <th className="py-3 px-4 text-center">Audit Progression</th>
                    <th className="py-3 px-4">Operator</th>
                    <th className="py-3 px-4">Reason / Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {movements.map((m) => {
                    const isPositive =
                      m.type === 'STOCK_RECEIVED' ||
                      m.type === 'MANUAL_INCREASE' ||
                      m.type === 'SALE_RETURN';

                    return (
                      <tr key={m._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                          {new Date(m.timestamp).toLocaleString('en-IN', {
                            dateStyle: 'short',
                            timeStyle: 'short'
                          })}
                        </td>

                        <td className="py-3 px-4">
                          <div className="font-semibold text-slate-900">{m.productName}</div>
                          <div className="text-[11px] font-mono text-slate-400">{m.productSku}</div>
                        </td>

                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`font-mono text-[11px] font-medium ${
                              m.type === 'STOCK_RECEIVED'
                                ? 'text-blue-700'
                                : m.type === 'MANUAL_INCREASE'
                                ? 'text-emerald-700'
                                : m.type === 'MANUAL_DECREASE'
                                ? 'text-rose-700'
                                : m.type === 'SALE'
                                ? 'text-slate-800'
                                : 'text-purple-700'
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono font-bold whitespace-nowrap tabular-nums">
                          <span className={isPositive ? 'text-emerald-600' : 'text-rose-600'}>
                            {isPositive ? `+${m.quantity}` : `-${m.quantity}`}
                          </span>
                        </td>

                        <td className="py-3 px-4 text-center font-mono text-slate-500 whitespace-nowrap tabular-nums">
                          <span>{m.previousStock}</span>
                          <span className="mx-1 text-slate-300">→</span>
                          <span className="font-semibold text-slate-900">{m.resultingStock}</span>
                        </td>

                        <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                          {m.userName}
                        </td>

                        <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                          {m.reason}
                          {m.invoiceNumber && (
                            <span className="ml-1 font-mono text-[11px] text-slate-400">
                              ({m.invoiceNumber})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {movements.length === 0 && !loading && (
              <div className="p-12 text-center text-xs text-slate-400">
                No inventory movements recorded for this filter.
              </div>
            )}

            {/* Pagination Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
              <div>
                Showing <span className="font-mono font-medium">{movements.length}</span> of{' '}
                <span className="font-mono font-medium">{totalMovements}</span> logs
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setMovementPage((p) => Math.max(1, p - 1))}
                  disabled={movementPage <= 1}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  Previous
                </button>
                <span className="font-mono tabular-nums">
                  {movementPage} / {movementPages || 1}
                </span>
                <button
                  onClick={() => setMovementPage((p) => Math.min(movementPages, p + 1))}
                  disabled={movementPage >= movementPages}
                  className="px-3 py-1 bg-white border border-slate-200 rounded-md hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: Dedicated Low-Stock Alerts */}
      {activeSubTab === 'lowstock' && (
        <div className="space-y-4">
          {/* Summary Alert Header */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <h3 className="font-semibold text-amber-900 text-xs">
                  {lowStockData?.summary.totalAlerts || 0} Products Need Attention
                </h3>
                <p className="text-[11px] text-amber-700 mt-0.5">
                  Available stock is at or below the configured reorder threshold. Receive stock to prevent stockouts.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-xs font-mono font-semibold">
              <span className="text-rose-600">
                {lowStockData?.summary.outOfStockCount || 0} Out of Stock
              </span>
              <span className="text-amber-700">
                {lowStockData?.summary.lowStockCount || 0} Low Stock
              </span>
            </div>
          </div>

          {/* Low Stock Table */}
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-left font-medium">
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Available Stock</th>
                    <th className="py-3 px-4 text-center">Reorder Threshold</th>
                    <th className="py-3 px-4 text-center">Deficit</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockData?.products.map((p) => {
                    const deficit = Math.max(0, p.reorderLevel - p.availableStock);

                    return (
                      <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                          {p.sku}
                        </td>

                        <td className="py-3.5 px-4 font-semibold text-slate-900">
                          {p.name}
                        </td>

                        <td className="py-3.5 px-4 text-slate-500">
                          {p.category}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-bold tabular-nums">
                          <span className={p.availableStock === 0 ? 'text-rose-600' : 'text-amber-600'}>
                            {p.availableStock} {p.unit || 'pcs'}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono text-slate-500 tabular-nums">
                          {p.reorderLevel}
                        </td>

                        <td className="py-3.5 px-4 text-center font-mono font-medium text-rose-600 tabular-nums">
                          +{deficit} {p.unit || 'pcs'}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {isAdmin ? (
                            <button
                              onClick={() => setAdjustingProduct(p)}
                              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-medium rounded-lg transition-colors inline-flex items-center gap-1.5 shadow-xs"
                            >
                              <PackageCheck className="w-3.5 h-3.5" />
                              <span>Receive Stock</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">Admin only</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {(!lowStockData?.products || lowStockData.products.length === 0) && (
              <div className="p-12 text-center text-xs text-slate-400">
                All inventory items are currently healthy and above reorder thresholds.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Adjustment Modal */}
      {adjustingProduct && (
        <StockAdjustmentModal
          product={adjustingProduct}
          onClose={() => setAdjustingProduct(null)}
          onSuccess={() => {
            fetchMovements();
            fetchLowStock();
          }}
        />
      )}
    </div>
  );
};
