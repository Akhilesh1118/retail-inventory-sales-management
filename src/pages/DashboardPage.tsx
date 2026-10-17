import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import { Product } from '../types/index.ts';
import { ActiveTab } from '../components/Header.tsx';
import {
  TrendingUp,
  ShoppingCart,
  AlertTriangle,
  Package,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  IndianRupee
} from 'lucide-react';

interface DashboardPageProps {
  setActiveTab: (tab: ActiveTab) => void;
  onOpenAdjustment?: (product: Product) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ setActiveTab, onOpenAdjustment }) => {
  const [period, setPeriod] = useState<'today' | '7days' | '30days'>('7days');
  const [salesReport, setSalesReport] = useState<any>(null);
  const [profitReport, setProfitReport] = useState<any>(null);
  const [lowStockData, setLowStockData] = useState<{
    summary: { totalAlerts: number; outOfStockCount: number; lowStockCount: number };
    products: Product[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      let startStr: string | undefined = undefined;

      if (period === 'today') {
        startStr = now.toISOString().slice(0, 10);
      } else if (period === '7days') {
        const d = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        startStr = d.toISOString().slice(0, 10);
      } else if (period === '30days') {
        const d = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        startStr = d.toISOString().slice(0, 10);
      }

      const endStr = now.toISOString().slice(0, 10);

      const [salesRes, profitRes, lowStockRes] = await Promise.all([
        api.getSalesReport(startStr, endStr),
        api.getProfitReport(startStr, endStr),
        api.getLowStock()
      ]);

      setSalesReport(salesRes);
      setProfitReport(profitRes);
      setLowStockData(lowStockRes);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [period]);

  const currencySymbol = '₹';

  return (
    <div className="space-y-6">
      {/* Top Controls: Welcome & Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Retail Overview</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time stock valuation, sales performance, and low-stock telemetry
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Segmented Control for Period */}
          <div className="flex items-center p-1 bg-slate-100 rounded-lg">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === 'today'
                  ? 'bg-white text-slate-950 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setPeriod('7days')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === '7days'
                  ? 'bg-white text-slate-950 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Last 7 Days
            </button>
            <button
              onClick={() => setPeriod('30days')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                period === '30days'
                  ? 'bg-white text-slate-950 shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Last 30 Days
            </button>
          </div>

          <button
            onClick={fetchData}
            title="Refresh Metrics"
            className="p-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 rounded-lg transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg">
          {error}
        </div>
      )}

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sales */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Gross Sales</span>
            <IndianRupee className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
            {currencySymbol}
            {salesReport ? salesReport.summary.totalSalesAmount.toFixed(2) : '0.00'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>{salesReport?.summary.totalTransactions || 0} completed orders</span>
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Gross Profit</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-emerald-600 tabular-nums">
            {currencySymbol}
            {profitReport ? profitReport.metrics.grossProfit.toFixed(2) : '0.00'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Margin: </span>
            <span className="font-mono font-semibold text-emerald-700 tabular-nums">
              {profitReport ? profitReport.metrics.grossMarginPercent : 0}%
            </span>
          </div>
        </div>

        {/* Average Order Value */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Avg Order Value</span>
            <ShoppingCart className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
            {currencySymbol}
            {salesReport ? salesReport.summary.averageOrderValue.toFixed(2) : '0.00'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
            <span>Tax collected: {currencySymbol}{salesReport?.summary.totalTax.toFixed(2) || '0.00'}</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div
          onClick={() => setActiveTab('inventory')}
          className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs hover:border-amber-300 transition-colors cursor-pointer group"
        >
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Stock Alerts</span>
            <AlertTriangle className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-amber-600 tabular-nums flex items-center justify-between">
            <span>{lowStockData ? lowStockData.summary.totalAlerts : 0}</span>
            <span className="text-xs font-normal text-slate-400 group-hover:text-amber-600 flex items-center gap-1">
              View <ArrowRight className="w-3 h-3" />
            </span>
          </div>
          <div className="mt-1 text-xs text-slate-500">
            <span>{lowStockData?.summary.outOfStockCount || 0} out of stock</span>
            <span className="mx-1">·</span>
            <span>{lowStockData?.summary.lowStockCount || 0} low stock</span>
          </div>
        </div>
      </div>

      {/* Quick Launchpad Action Bar */}
      <div className="bg-slate-900 text-white rounded-xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h3 className="font-semibold text-sm">Store Point of Sale Quick Access</h3>
          <p className="text-xs text-slate-300 mt-0.5">
            Checkout customer carts with authoritative backend pricing & atomic inventory deduction
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('pos')}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Launch POS Checkout</span>
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Product Catalog</span>
          </button>
        </div>
      </div>

      {/* Two Column Grid: Top Selling Products & Low Stock Alerts Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top-Selling Products */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Top-Selling Products</h2>
              <p className="text-xs text-slate-500 mt-0.5">Ranked by units sold in chosen period</p>
            </div>
            <button
              onClick={() => setActiveTab('reports')}
              className="text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1"
            >
              Full Report <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-0">
            {salesReport?.topSellingProducts && salesReport.topSellingProducts.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-left">
                    <th className="py-2.5 px-6 font-medium">Product / SKU</th>
                    <th className="py-2.5 px-4 font-medium text-center">Units Sold</th>
                    <th className="py-2.5 px-6 font-medium text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {salesReport.topSellingProducts.map((p: any) => (
                    <tr key={p.productId} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-6">
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{p.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-semibold text-slate-900 tabular-nums">
                        {p.quantitySold}
                      </td>
                      <td className="py-3 px-6 text-right font-mono font-medium text-slate-900 tabular-nums">
                        {currencySymbol}{p.totalRevenue.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                No product sales recorded in this timeframe.
              </div>
            )}
          </div>
        </div>

        {/* Low-Stock Alert List */}
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Inventory Low-Stock Alerts</h2>
              <p className="text-xs text-slate-500 mt-0.5">Products at or below configured reorder level</p>
            </div>
            <button
              onClick={() => setActiveTab('inventory')}
              className="text-xs font-medium text-amber-700 hover:text-amber-800 flex items-center gap-1"
            >
              Manage Stock <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="p-0">
            {lowStockData?.products && lowStockData.products.length > 0 ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 text-left">
                    <th className="py-2.5 px-6 font-medium">Item & SKU</th>
                    <th className="py-2.5 px-4 font-medium text-center">Available</th>
                    <th className="py-2.5 px-4 font-medium text-center">Reorder At</th>
                    <th className="py-2.5 px-6 font-medium text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lowStockData.products.slice(0, 5).map((p) => (
                    <tr key={p._id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-3 px-6">
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-[11px] font-mono text-slate-400">{p.sku}</div>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`font-mono font-bold tabular-nums ${
                            p.availableStock === 0 ? 'text-rose-600' : 'text-amber-600'
                          }`}
                        >
                          {p.availableStock} {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-500 tabular-nums">
                        {p.reorderLevel}
                      </td>
                      <td className="py-3 px-6 text-right">
                        <button
                          onClick={() => {
                            if (onOpenAdjustment) {
                              onOpenAdjustment(p);
                            } else {
                              setActiveTab('inventory');
                            }
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Receive
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-8 text-center text-xs text-slate-400">
                All inventory levels are currently above reorder thresholds.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
