import React, { useState } from 'react';
import { Product, InventoryMovement } from '../types/index.ts';
import { api } from '../api/client.ts';
import { X, ArrowUpRight, ArrowDownRight, PackageCheck } from 'lucide-react';

interface StockAdjustmentModalProps {
  product: Product;
  onClose: () => void;
  onSuccess: (updatedProduct: Product, movement: InventoryMovement) => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  product,
  onClose,
  onSuccess
}) => {
  const [adjustmentType, setAdjustmentType] = useState<
    'STOCK_RECEIVED' | 'MANUAL_INCREASE' | 'MANUAL_DECREASE'
  >('STOCK_RECEIVED');
  const [quantity, setQuantity] = useState<string>('10');
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const qtyNum = Number(quantity) || 0;
  const currentStock = product.availableStock;

  let resultingStock = currentStock;
  if (adjustmentType === 'STOCK_RECEIVED' || adjustmentType === 'MANUAL_INCREASE') {
    resultingStock = currentStock + qtyNum;
  } else if (adjustmentType === 'MANUAL_DECREASE') {
    resultingStock = currentStock - qtyNum;
  }

  const isInvalidDecrease = adjustmentType === 'MANUAL_DECREASE' && resultingStock < 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!qtyNum || qtyNum <= 0 || !Number.isInteger(qtyNum)) {
      setError('Quantity must be a positive integer greater than zero.');
      return;
    }

    if (!reason || reason.trim() === '') {
      setError('Audit reason / reference is mandatory for inventory traceability.');
      return;
    }

    if (isInvalidDecrease) {
      setError(`Cannot decrease stock by ${qtyNum}. Available stock is only ${currentStock}. Negative stock is forbidden.`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.adjustInventory({
        productId: product._id,
        adjustmentType,
        quantity: qtyNum,
        reason: reason.trim()
      });
      onSuccess(res.product, res.movement);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to adjust inventory');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">Inventory Stock Adjustment</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {product.name} · <span className="font-mono">{product.sku}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Current Stock Indicator */}
          <div className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg">
            <span className="text-slate-600 font-medium">Current Stock on Hand:</span>
            <span className="font-mono text-sm font-bold text-slate-900 tabular-nums">
              {currentStock} {product.unit || 'pcs'}
            </span>
          </div>

          {/* Adjustment Type Selector */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Adjustment Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('STOCK_RECEIVED')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  adjustmentType === 'STOCK_RECEIVED'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold">
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Receive</span>
                </div>
                <div className={`text-[10px] mt-0.5 ${adjustmentType === 'STOCK_RECEIVED' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Vendor intake
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('MANUAL_INCREASE')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  adjustmentType === 'MANUAL_INCREASE'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Increase</span>
                </div>
                <div className={`text-[10px] mt-0.5 ${adjustmentType === 'MANUAL_INCREASE' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Count correction
                </div>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('MANUAL_DECREASE')}
                className={`p-2.5 rounded-lg border text-left transition-colors ${
                  adjustmentType === 'MANUAL_DECREASE'
                    ? 'border-slate-900 bg-slate-900 text-white'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <div className="flex items-center gap-1 font-semibold">
                  <ArrowDownRight className="w-3.5 h-3.5 text-rose-400" />
                  <span>Decrease</span>
                </div>
                <div className={`text-[10px] mt-0.5 ${adjustmentType === 'MANUAL_DECREASE' ? 'text-slate-300' : 'text-slate-500'}`}>
                  Damage / writeoff
                </div>
              </button>
            </div>
          </div>

          {/* Quantity */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Quantity to Adjust <span className="text-rose-500">*</span>
            </label>
            <input
              type="number"
              min="1"
              step="1"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums text-sm focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          {/* Resulting Stock Preview */}
          <div
            className={`p-3 rounded-lg border flex items-center justify-between ${
              isInvalidDecrease
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-900'
            }`}
          >
            <span className="font-medium">
              {isInvalidDecrease ? 'Error: Negative Stock!' : 'Expected Resulting Stock:'}
            </span>
            <span className="font-mono text-sm font-bold tabular-nums">
              {resultingStock} {product.unit || 'pcs'}
            </span>
          </div>

          {/* Audit Reason */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Audit Reason / Reference <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. PO-8821 delivery from Metro Distributors, or damaged box in aisle 3"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              required
            />
            <span className="text-[11px] text-slate-500">
              Audit trail will log this reason with your user identity and timestamp.
            </span>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isInvalidDecrease}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm disabled:opacity-50"
            >
              {loading ? 'Processing...' : 'Apply Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
