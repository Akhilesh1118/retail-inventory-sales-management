import React, { useState } from 'react';
import { api } from '../api/client.ts';
import {
  Sparkles,
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Image as ImageIcon,
  ShieldCheck,
  Package,
  Layers
} from 'lucide-react';

interface FillMissingImagesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  missingCount: number;
  totalProducts: number;
}

export const FillMissingImagesModal: React.FC<FillMissingImagesModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  missingCount,
  totalProducts
}) => {
  const [loading, setLoading] = useState(false);
  const [force, setForce] = useState(false);
  const [batchLimit, setBatchLimit] = useState<number>(0); // 0 means all
  const [result, setResult] = useState<{
    success: boolean;
    totalScanned: number;
    updated: number;
    failed: number;
    skipped: number;
    message: string;
    updatedProducts?: Array<{ id: string; sku: string; name: string; imageUrl: string }>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleStartFill = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.fillMissingImages({
        force,
        limit: batchLimit > 0 ? batchLimit : undefined
      });

      setResult(res);
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to populate missing product images.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-900 to-[#064e3b] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-lime-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base leading-tight">Auto-Fill Missing Product Images</h3>
              <p className="text-[11px] text-emerald-200/90 font-medium">
                Generate tailored retail illustrations &amp; upload to Cloudinary
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-emerald-200 hover:text-white hover:bg-emerald-800/60 transition-colors disabled:opacity-50 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Metrics Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Catalog</div>
              <div className="text-xl font-extrabold text-slate-900 mt-0.5">{totalProducts}</div>
              <div className="text-[10px] text-slate-400">Total Products</div>
            </div>

            <div className="bg-emerald-50/70 border border-emerald-200 p-3 rounded-xl text-center">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">With Image</div>
              <div className="text-xl font-extrabold text-emerald-800 mt-0.5">
                {Math.max(0, totalProducts - missingCount)}
              </div>
              <div className="text-[10px] text-emerald-600">Preserved as-is</div>
            </div>

            <div className={`p-3 rounded-xl text-center border ${
              missingCount > 0
                ? 'bg-amber-50 border-amber-200'
                : 'bg-emerald-50 border-emerald-200'
            }`}>
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Missing</div>
              <div className="text-xl font-extrabold text-amber-900 mt-0.5">{missingCount}</div>
              <div className="text-[10px] text-amber-600 font-medium">
                {missingCount > 0 ? 'Ready to fill' : 'All filled!'}
              </div>
            </div>
          </div>

          {/* Cloudinary Integration Status */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <UploadCloud className="w-4 h-4 text-emerald-600" />
              <span className="font-semibold text-slate-700">Storage Service:</span>
              <span className="font-mono text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">
                Cloudinary (Connected)
              </span>
            </div>
            <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              Direct Cloud Storage
            </span>
          </div>

          {/* Feature details */}
          <div className="space-y-2 text-xs text-slate-600 bg-emerald-50/50 p-3.5 rounded-xl border border-emerald-100">
            <div className="font-semibold text-emerald-950 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-emerald-700" />
              <span>Smart Category-Tailored Illustrations</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-600">
              Each product without an image receives a clean vector artwork matching its specific name and category
              (Rice bags for grain, Clay pots for Dal, Golden bottles for Oils, Chai canisters for Tea, Kraft bags for Coffee, Blister packs for Cables, etc.).
            </p>
            <p className="text-[11px] text-slate-500 italic">
              * Temporary illustrations are permanently saved in MongoDB Atlas &amp; Cloudinary, and can be replaced with actual photos anytime via Edit Product.
            </p>
          </div>

          {/* Options */}
          {!result && (
            <div className="pt-2 border-t border-slate-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700">Batch Limit</label>
                <select
                  value={batchLimit}
                  onChange={(e) => setBatchLimit(Number(e.target.value))}
                  disabled={loading}
                  className="text-xs px-2.5 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-emerald-700"
                >
                  <option value={0}>All Missing ({missingCount} items)</option>
                  <option value={15}>Batch of 15 items</option>
                  <option value={30}>Batch of 30 items</option>
                  <option value={60}>Batch of 60 items</option>
                </select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={force}
                  onChange={(e) => setForce(e.target.checked)}
                  disabled={loading}
                  className="rounded text-emerald-700 focus:ring-emerald-600"
                />
                <span className="text-xs text-slate-600">
                  Regenerate and overwrite existing placeholder images
                </span>
              </label>
            </div>
          )}

          {/* Loading Progress State */}
          {loading && (
            <div className="p-4 bg-emerald-50/80 border border-emerald-200 rounded-xl space-y-3 text-center">
              <div className="flex items-center justify-center gap-2 text-emerald-900 font-bold text-sm">
                <RefreshCw className="w-5 h-5 animate-spin text-emerald-700" />
                <span>Generating &amp; Uploading Illustrations to Cloudinary...</span>
              </div>
              <div className="w-full bg-emerald-200/80 h-2 rounded-full overflow-hidden">
                <div className="bg-emerald-600 h-full w-full animate-pulse rounded-full" />
              </div>
              <p className="text-[11px] text-emerald-700">
                Please wait while high-resolution vector illustrations are rendered and uploaded to your cloud account.
              </p>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Result Summary */}
          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                <span>{result.message}</span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <div className="text-[10px] text-slate-500 uppercase">Updated</div>
                  <div className="text-lg font-bold text-emerald-700">{result.updated}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <div className="text-[10px] text-slate-500 uppercase">Skipped</div>
                  <div className="text-lg font-bold text-slate-700">{result.skipped}</div>
                </div>
                <div className="bg-white p-2 rounded-lg border border-emerald-100">
                  <div className="text-[10px] text-slate-500 uppercase">Failed</div>
                  <div className="text-lg font-bold text-slate-700">{result.failed}</div>
                </div>
              </div>

              {result.updatedProducts && result.updatedProducts.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <div className="text-[11px] font-semibold text-emerald-900">
                    Sample Updated Illustrations:
                  </div>
                  <div className="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1 bg-white/60 rounded-lg border border-emerald-100">
                    {result.updatedProducts.slice(0, 8).map((p) => (
                      <div
                        key={p.id}
                        className="bg-white p-1 rounded-md border border-slate-200 text-center shadow-2xs"
                        title={p.name}
                      >
                        <img
                          src={p.imageUrl}
                          alt={p.name}
                          className="w-full h-12 object-contain rounded bg-slate-50"
                        />
                        <div className="text-[9px] font-medium text-slate-800 truncate mt-1">
                          {p.name}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            {result ? (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Done &amp; View Catalog
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleStartFill}
                  disabled={loading || (missingCount === 0 && !force)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-xs rounded-xl transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-lime-300" />
                      <span>
                        {missingCount === 0 && !force
                          ? 'All Images Already Filled'
                          : `Populate ${batchLimit > 0 ? batchLimit : missingCount} Images`}
                      </span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
