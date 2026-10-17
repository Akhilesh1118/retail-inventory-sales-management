import React, { useRef } from 'react';
import { Sale, StoreConfig } from '../types/index.ts';
import { Printer, X, CheckCircle2 } from 'lucide-react';

interface PrintInvoiceModalProps {
  sale: Sale;
  config: StoreConfig | null;
  onClose: () => void;
}

export const PrintInvoiceModal: React.FC<PrintInvoiceModalProps> = ({ sale, config, onClose }) => {
  const printAreaRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    window.print();
  };

  const currencySymbol = '₹';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Action Header (hidden in print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Invoice {sale.invoiceNumber}</h3>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Tax Invoice</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Document */}
        <div ref={printAreaRef} className="p-8 overflow-y-auto print:p-0 print:overflow-visible font-sans text-slate-800">
          {/* Store Brand / Tax Header */}
          <div className="text-center pb-6 border-b border-dashed border-slate-300">
            <h1 className="text-xl font-bold tracking-tight text-slate-950 uppercase">
              {config?.storeName || 'Apex Retail Mart'}
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              {config?.storeAddress || 'Plot 42, Commercial Avenue, Sector 5'}
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              GSTIN: <span className="font-mono text-slate-700">{config?.gstin || '07AAAAA0000A1Z5'}</span>
            </p>
            <div className="mt-3 inline-block px-3 py-0.5 bg-slate-100 rounded text-[11px] font-semibold text-slate-700 tracking-wide uppercase">
              Retail Tax Invoice
            </div>
          </div>

          {/* Invoice Meta Grid */}
          <div className="grid grid-cols-2 gap-4 py-4 text-xs border-b border-slate-200">
            <div>
              <p className="text-slate-500">Invoice Number:</p>
              <p className="font-mono font-semibold text-slate-900 mt-0.5">{sale.invoiceNumber}</p>

              <p className="text-slate-500 mt-2">Cashier / Staff:</p>
              <p className="font-medium text-slate-900 mt-0.5">{sale.userName}</p>
            </div>
            <div className="text-right">
              <p className="text-slate-500">Date & Time:</p>
              <p className="font-mono text-slate-900 mt-0.5">
                {new Date(sale.createdAt).toLocaleString('en-IN', {
                  dateStyle: 'medium',
                  timeStyle: 'short'
                })}
              </p>

              <p className="text-slate-500 mt-2">Payment Method:</p>
              <p className="font-semibold text-slate-900 mt-0.5">{sale.paymentMethod}</p>
            </div>
          </div>

          {/* Line Items Table */}
          <div className="py-4">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-300 text-slate-500">
                  <th className="text-left font-medium pb-2">Item Description</th>
                  <th className="text-center font-medium pb-2">Qty</th>
                  <th className="text-right font-medium pb-2">Unit Price</th>
                  <th className="text-right font-medium pb-2">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {sale.items.map((item, idx) => (
                  <tr key={idx} className="py-2">
                    <td className="py-2.5 pr-2">
                      <div className="font-medium text-slate-900">{item.name}</div>
                      <div className="text-[11px] font-mono text-slate-400">{item.sku}</div>
                    </td>
                    <td className="text-center py-2.5 font-mono tabular-nums">{item.quantity}</td>
                    <td className="text-right py-2.5 font-mono tabular-nums text-slate-600">
                      {currencySymbol}{item.unitSellingPrice.toFixed(2)}
                    </td>
                    <td className="text-right py-2.5 font-mono font-medium tabular-nums text-slate-900">
                      {currencySymbol}{item.lineTotal.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals Section */}
          <div className="pt-3 border-t border-slate-300 space-y-1.5 text-xs">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span className="font-mono tabular-nums">{currencySymbol}{sale.subtotal.toFixed(2)}</span>
            </div>

            {sale.discountAmount > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount ({sale.discountPercent}%):</span>
                <span className="font-mono tabular-nums">-{currencySymbol}{sale.discountAmount.toFixed(2)}</span>
              </div>
            )}

            <div className="flex justify-between text-slate-600">
              <span>GST / Tax ({sale.taxPercent}%):</span>
              <span className="font-mono tabular-nums">+{currencySymbol}{sale.taxAmount.toFixed(2)}</span>
            </div>

            <div className="flex justify-between text-base font-bold text-slate-950 pt-2 border-t border-slate-900">
              <span>Final Total:</span>
              <span className="font-mono tabular-nums">{currencySymbol}{sale.totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Status & Footer Notice */}
          <div className="mt-8 text-center text-[11px] text-slate-400 border-t border-dashed border-slate-200 pt-4">
            <p>Thank you for shopping with us!</p>
            <p className="mt-0.5">Goods once sold can be returned within 7 days with original tax invoice.</p>
            {sale.status === 'RETURNED' && (
              <div className="mt-2 text-rose-600 font-bold tracking-widest uppercase">
                [ TRANSACTION RETURNED / REFUNDED ]
              </div>
            )}
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div className="px-6 py-3 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
