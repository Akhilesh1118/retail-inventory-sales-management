import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import { ProductImage } from './ProductImage.tsx';
import {
  X,
  ShoppingCart,
  Check,
  ShieldCheck,
  Truck,
  Plus,
  Minus,
  Sparkles
} from 'lucide-react';

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  inCartQty: number;
}

export const ProductQuickViewModal: React.FC<ProductQuickViewModalProps> = ({
  product,
  onClose,
  onAddToCart,
  inCartQty
}) => {
  const [selectedQty, setSelectedQty] = useState<number>(1);

  if (!product) return null;

  const currencySymbol = '₹';
  const isOutOfStock = product.availableStock <= 0;
  const isLowStock = product.availableStock > 0 && product.availableStock <= product.reorderLevel;
  const remainingStock = Math.max(0, product.availableStock - inCartQty);
  const canAdd = product.isActive && !isOutOfStock && remainingStock > 0;

  const handleAdd = () => {
    if (!canAdd) return;
    onAddToCart(product, selectedQty);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-stone-200 overflow-hidden flex flex-col sm:flex-row relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3.5 right-3.5 z-10 p-1.5 rounded-full bg-white/90 hover:bg-stone-100 text-stone-500 hover:text-stone-900 transition-colors shadow-xs"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left: Product Image */}
        <div className="sm:w-1/2 aspect-square sm:aspect-auto bg-[#f5f5f3] flex items-center justify-center border-b sm:border-b-0 sm:border-r border-stone-100 p-6 relative">
          <ProductImage
            src={product.imageUrl}
            alt={product.name}
            size="lg"
            category={product.category}
            loading="eager"
            fetchPriority="high"
            sizes="(max-width: 639px) 90vw, 40vw"
            className="w-full h-full max-h-80 object-contain rounded-xl"
          />

          {/* Stock Tag on Image */}
          <div className="absolute top-4 left-4 z-10">
            {isOutOfStock ? (
              <span className="px-2.5 py-1 rounded-md text-xs font-bold bg-stone-100 text-stone-600 border border-stone-300 shadow-2xs">
                Sold Out
              </span>
            ) : isLowStock ? (
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                Only {product.availableStock} {product.unit || 'units'} left
              </span>
            ) : (
              <span className="px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                In Stock ({product.availableStock} available)
              </span>
            )}
          </div>
        </div>

        {/* Right: Product Details */}
        <div className="sm:w-1/2 p-6 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs text-stone-500">
              <span className="font-bold text-[#064e3b] uppercase tracking-wider text-[10px] bg-emerald-50 px-2.5 py-0.5 rounded">
                {product.category}
              </span>
              <span className="font-mono text-stone-400 text-[11px]">{product.sku}</span>
            </div>

            <h2 className="text-lg font-bold text-stone-900 leading-snug">
              {product.name}
            </h2>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold text-stone-950 font-mono tabular-nums">
                {currencySymbol}{product.sellingPrice.toFixed(2)}
              </span>
              <span className="text-xs text-stone-500">
                per {product.unit || 'piece'} (incl. GST)
              </span>
            </div>

            {/* Description */}
            <div className="pt-2 border-t border-stone-100">
              <h4 className="text-xs font-bold text-stone-700 mb-1">Product Details:</h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                {product.description ||
                  `Quality retail item verified by our in-store management. Available for direct inventory pickup or billing.`}
              </p>
              {product.imageCredit && product.imageSourceUrl && (
                <p className="mt-2 text-[10px] text-stone-400">
                  Image: <a href={product.imageSourceUrl} target="_blank" rel="noreferrer" className="underline underline-offset-2 hover:text-stone-600">{product.imageCredit}</a>
                </p>
              )}
            </div>

            {/* Store Guarantees */}
            <div className="space-y-2 pt-2 text-[11px] text-stone-600">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>100% Genuine Inventory Verified</span>
              </div>
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Immediate pickup ready at main counter</span>
              </div>
            </div>
          </div>

          {/* Action: Quantity Stepper & Add Button */}
          <div className="pt-4 border-t border-stone-200 space-y-3">
            {canAdd ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 font-medium">Select Quantity:</span>
                  <div className="flex items-center border border-stone-300 rounded-xl bg-stone-50 overflow-hidden shadow-2xs">
                    <button
                      onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                      disabled={selectedQty <= 1}
                      className="p-1.5 px-3 text-stone-600 hover:bg-stone-200 disabled:opacity-40 font-bold transition-colors"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="px-2 font-mono font-bold text-stone-900 tabular-nums">
                      {selectedQty}
                    </span>
                    <button
                      onClick={() =>
                        setSelectedQty((q) => Math.min(remainingStock, q + 1))
                      }
                      disabled={selectedQty >= remainingStock}
                      className="p-1.5 px-3 text-stone-600 hover:bg-stone-200 disabled:opacity-40 font-bold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleAdd}
                  className="w-full py-3 px-4 bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 active:scale-98"
                >
                  <ShoppingCart className="w-4 h-4" />
                  <span>
                    Add to Cart · {currencySymbol}
                    {(product.sellingPrice * selectedQty).toFixed(2)}
                  </span>
                </button>
              </div>
            ) : (
              <button
                disabled
                className="w-full py-3 px-4 bg-stone-100 text-stone-400 font-semibold text-xs rounded-xl cursor-not-allowed border border-stone-200"
              >
                {isOutOfStock ? 'Currently Sold Out' : 'Maximum stock already in cart'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
