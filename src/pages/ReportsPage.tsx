import React, { useState, useEffect } from 'react';
import { api } from '../api/client.ts';
import {
  TrendingUp,
  Download,
  Calendar,
  IndianRupee,
  RefreshCw,
  PieChart,
  BarChart2
} from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [datePreset, setDatePreset] = useState<'today' | '7days' | '30days' | 'custom'>('7days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const [salesReport, setSalesReport] = useState<any>(null);
  const [profitReport, setProfitReport] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const now = new Date();
      let sDate = startDate;
      let eDate = endDate;

      if (datePreset === 'today') {
        sDate = now.toISOString().slice(0, 10);
        eDate = now.toISOString().slice(0, 10);
      } else if (datePreset === '7days') {
        const d = new Date(now.getTime() - 7 * 24 * 3600 * 1000);
        sDate = d.toISOString().slice(0, 10);
        eDate = now.toISOString().slice(0, 10);
      } else if (datePreset === '30days') {
        const d = new Date(now.getTime() - 30 * 24 * 3600 * 1000);
        sDate = d.toISOString().slice(0, 10);
        eDate = now.toISOString().slice(0, 10);
      }

      const [salesRes, profitRes] = await Promise.all([
        api.getSalesReport(sDate || undefined, eDate || undefined),
        api.getProfitReport(sDate || undefined, eDate || undefined)
      ]);

      setSalesReport(salesRes);
      setProfitReport(profitRes);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch financial reports');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [datePreset, startDate, endDate]);

  const currencySymbol = '₹';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900">Financial & Profit Analytics</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gross profit margin reports based on purchase-cost snapshots at time of sale
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <a
            href={`/api/reports/export/sales.csv?startDate=${startDate}&endDate=${endDate}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </a>

          <button
            onClick={fetchReports}
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

      {/* Date Range Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setDatePreset('today')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              datePreset === 'today'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setDatePreset('7days')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              datePreset === '7days'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Last 7 Days
          </button>
          <button
            onClick={() => setDatePreset('30days')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              datePreset === '30days'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Last 30 Days
          </button>
          <button
            onClick={() => setDatePreset('custom')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
              datePreset === 'custom'
                ? 'bg-slate-900 text-white font-semibold'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Custom Range
          </button>
        </div>

        {datePreset === 'custom' && (
          <div className="flex items-center gap-2">
            <span className="text-slate-500">From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
            <span className="text-slate-500">To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-slate-900"
            />
          </div>
        )}
      </div>

      {/* KPI Cards: Revenue, Cost, Gross Profit, Gross Margin % */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Gross Revenue */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Total Gross Sales</div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
            {currencySymbol}
            {profitReport ? profitReport.metrics.totalRevenue.toFixed(2) : '0.00'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {salesReport?.summary.totalTransactions || 0} customer orders
          </div>
        </div>

        {/* Cost of Goods Sold (COGS) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Cost of Goods Sold (COGS)</div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-600 tabular-nums">
            {currencySymbol}
            {profitReport ? profitReport.metrics.totalCost.toFixed(2) : '0.00'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Calculated from unit cost snapshots
          </div>
        </div>

        {/* Gross Profit */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Gross Profit (Pre-OpEx)</div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-emerald-600 tabular-nums">
            {currencySymbol}
            {profitReport ? profitReport.metrics.grossProfit.toFixed(2) : '0.00'}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Net Revenue minus Purchase Cost
          </div>
        </div>

        {/* Gross Margin % */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
          <div className="text-xs font-medium text-slate-500">Gross Profit Margin</div>
          <div className="mt-2 text-2xl font-bold font-mono tracking-tight text-slate-900 tabular-nums">
            {profitReport ? profitReport.metrics.grossMarginPercent : 0}%
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Profit ratio over net sales volume
          </div>
        </div>
      </div>

      {/* Category-Wise Profit Breakdown */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-slate-900">Profitability by Product Category</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of sales revenue, inventory cost, and margin contributions
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 text-left font-medium">
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4 text-center">Units Sold</th>
                <th className="py-3 px-4 text-right">Revenue</th>
                <th className="py-3 px-4 text-right">Purchase Cost</th>
                <th className="py-3 px-4 text-right">Gross Profit</th>
                <th className="py-3 px-4 text-right">Margin %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {profitReport?.categoryBreakdown && profitReport.categoryBreakdown.length > 0 ? (
                profitReport.categoryBreakdown.map((c: any) => (
                  <tr key={c.category} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-slate-900">{c.category}</td>
                    <td className="py-3.5 px-4 text-center font-mono tabular-nums text-slate-600">
                      {c.unitsSold}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-900">
                      {currencySymbol}{c.revenue.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono tabular-nums text-slate-500">
                      {currencySymbol}{c.cost.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold tabular-nums text-emerald-600">
                      {currencySymbol}{c.profit.toFixed(2)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-semibold tabular-nums text-slate-900">
                      {c.marginPercent}%
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400">
                    No categorical sales records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Accounting Notice */}
      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-600 text-[11px] leading-relaxed">
        <strong>Accounting Definition Note:</strong> The figures displayed above represent <em>Gross Profit</em>{' '}
        (Total Selling Value minus Actual Purchase Costs frozen at the time of each transaction). Taxes (GST) are held as a balance sheet liability and excluded from store gross profit. This calculation does not deduct general overhead, staff salaries, rent, or utilities.
      </div>
    </div>
  );
};
