import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../types/index.ts';
import { api } from '../api/client.ts';
import { ProductImage } from './ProductImage.tsx';
import {
  X,
  Sparkles,
  Upload,
  Trash2,
  RefreshCw,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface ProductModalProps {
  product?: Product | null; // null if creating, object if editing
  categories: string[];
  onClose: () => void;
  onSuccess: (product: Product) => void;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  product,
  categories,
  onClose,
  onSuccess
}) => {
  const isEditing = !!product;

  const [sku, setSku] = useState(product?.sku || '');
  const [name, setName] = useState(product?.name || '');
  const [category, setCategory] = useState(product?.category || (categories[0] || 'General'));
  const [customCategory, setCustomCategory] = useState('');
  const [purchasePrice, setPurchasePrice] = useState(product ? String(product.purchasePrice) : '');
  const [sellingPrice, setSellingPrice] = useState(product ? String(product.sellingPrice) : '');
  const [availableStock, setAvailableStock] = useState(product ? String(product.availableStock) : '0');
  const [reorderLevel, setReorderLevel] = useState(product ? String(product.reorderLevel) : '10');
  const [unit, setUnit] = useState(product?.unit || 'pcs');
  const [description, setDescription] = useState(product?.description || '');

  // Image state
  const [currentImageUrl, setCurrentImageUrl] = useState<string | undefined>(product?.imageUrl);
  const [currentPublicId, setCurrentPublicId] = useState<string | undefined>(product?.imagePublicId);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [imageSuccess, setImageSuccess] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clean up object URLs
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const generateRandomSku = () => {
    const prefix = (category.slice(0, 3) || 'ITM').toUpperCase();
    const rand = Math.floor(100 + Math.random() * 900);
    setSku(`${prefix}-${rand}`);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageError(null);
    setImageSuccess(null);
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setImageError('Invalid image format. Allowed formats: JPEG, PNG, WebP, GIF.');
      return;
    }

    // Validate size (5MB limit)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('File size exceeds the 5MB upload limit.');
      return;
    }

    setSelectedFile(file);
    const objUrl = URL.createObjectURL(file);
    setPreviewUrl(objUrl);

    // If editing existing product, upload/replace immediately
    if (isEditing && product) {
      uploadFileForProduct(product._id, file);
    }
  };

  const uploadFileForProduct = async (productId: string, file: File) => {
    setUploadingImage(true);
    setImageError(null);
    setImageSuccess(null);
    try {
      const res = await api.uploadProductImage(productId, file);
      setCurrentImageUrl(res.imageUrl);
      setCurrentPublicId(res.imagePublicId);
      setImageSuccess('Cloudinary image uploaded successfully.');
      setSelectedFile(null);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      onSuccess(res.product);
    } catch (err: any) {
      setImageError(err.message || 'Failed to upload image to Cloudinary');
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveImage = async () => {
    if (!isEditing || !product) {
      setSelectedFile(null);
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setCurrentImageUrl(undefined);
      setCurrentPublicId(undefined);
      return;
    }

    if (!window.confirm('Are you sure you want to remove this product image from Cloudinary?')) {
      return;
    }

    setUploadingImage(true);
    setImageError(null);
    setImageSuccess(null);
    try {
      const res = await api.removeProductImage(product._id);
      setCurrentImageUrl(undefined);
      setCurrentPublicId(undefined);
      setSelectedFile(null);
      setPreviewUrl(null);
      setImageSuccess('Product image removed from Cloudinary.');
      onSuccess(res.product);
    } catch (err: any) {
      setImageError(err.message || 'Failed to remove image from Cloudinary');
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanSku = sku.trim().toUpperCase();
    const cleanName = name.trim();
    const finalCategory = customCategory.trim() !== '' ? customCategory.trim() : category;
    const pPrice = Number(purchasePrice);
    const sPrice = Number(sellingPrice);
    const stock = Number(availableStock);
    const reorder = Number(reorderLevel);

    if (!cleanSku) {
      setError('SKU is required.');
      return;
    }
    if (!cleanName) {
      setError('Product name is required.');
      return;
    }
    if (isNaN(pPrice) || pPrice < 0) {
      setError('Purchase price must be a valid non-negative number.');
      return;
    }
    if (isNaN(sPrice) || sPrice < 0) {
      setError('Selling price must be a valid non-negative number.');
      return;
    }
    if (sPrice < pPrice) {
      const confirmLow = window.confirm(
        'Warning: Selling price is less than purchase cost (selling at a loss). Proceed anyway?'
      );
      if (!confirmLow) return;
    }

    setLoading(true);
    try {
      if (isEditing && product) {
        const res = await api.updateProduct(product._id, {
          sku: cleanSku,
          name: cleanName,
          category: finalCategory,
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          reorderLevel: reorder,
          description: description.trim(),
          unit: unit.trim()
        });
        onSuccess(res.product);
        onClose();
      } else {
        const res = await api.createProduct({
          sku: cleanSku,
          name: cleanName,
          category: finalCategory,
          purchasePrice: pPrice,
          sellingPrice: sPrice,
          availableStock: Math.max(0, stock),
          reorderLevel: Math.max(0, reorder),
          description: description.trim(),
          unit: unit.trim()
        });

        // If an image was selected during creation, upload it to Cloudinary now
        if (selectedFile) {
          try {
            const uploadRes = await api.uploadProductImage(res.product._id, selectedFile);
            onSuccess(uploadRes.product);
          } catch (imgErr: any) {
            console.warn('Product created, but initial image upload failed:', imgErr);
            onSuccess(res.product);
          }
        } else {
          onSuccess(res.product);
        }

        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const displayImageSrc = previewUrl || currentImageUrl;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50 shrink-0">
          <div>
            <h3 className="font-semibold text-slate-900 text-sm">
              {isEditing ? 'Edit Product Details' : 'Add New Retail Product'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isEditing ? `Modifying SKU: ${product?.sku}` : 'Create an inventory item with Cloudinary image'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body (Scrollable) */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg flex items-center gap-1.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Cloudinary Image Upload Section */}
          <div className="p-4 bg-slate-50/80 border border-slate-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-slate-600" />
                <span>Product Image (Cloudinary)</span>
              </label>
              <span className="text-[11px] text-slate-500">Max 5MB (JPEG, PNG, WebP)</span>
            </div>

            {imageError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-[11px] rounded-lg">
                {imageError}
              </div>
            )}

            {imageSuccess && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[11px] rounded-lg flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{imageSuccess}</span>
              </div>
            )}

            <div className="flex items-center gap-4">
              {/* Image Preview Box */}
              <div className="relative w-20 h-20 rounded-lg border border-slate-200 bg-white overflow-hidden shrink-0 shadow-2xs">
                <ProductImage
                  src={displayImageSrc}
                  alt={name || 'Product Preview'}
                  className="w-full h-full object-cover"
                  size="lg"
                />

                {uploadingImage && (
                  <div className="absolute inset-0 bg-slate-900/50 flex items-center justify-center text-white">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                  </div>
                )}
              </div>

              {/* Actions & File Input */}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="hidden"
                />

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-medium rounded-lg transition-colors shadow-2xs disabled:opacity-50"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{displayImageSrc ? 'Replace Image' : 'Upload Image'}</span>
                  </button>

                  {displayImageSrc && (
                    <button
                      type="button"
                      onClick={handleRemoveImage}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-200 hover:bg-rose-50 text-rose-600 font-medium rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove</span>
                    </button>
                  )}

                  {isEditing && product && (
                    <button
                      type="button"
                      onClick={async () => {
                        setUploadingImage(true);
                        setImageError(null);
                        setImageSuccess(null);
                        try {
                          const res = await api.generateProductImage(product._id);
                          setCurrentImageUrl(res.imageUrl);
                          setImageSuccess('Tailored retail illustration generated and saved to Cloudinary!');
                          onSuccess(res.product);
                        } catch (err: any) {
                          setImageError(err.message || 'Failed to auto-generate artwork');
                        } finally {
                          setUploadingImage(false);
                        }
                      }}
                      disabled={uploadingImage}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 font-medium rounded-lg transition-colors shadow-2xs disabled:opacity-50 cursor-pointer"
                      title="Auto-generate tailored retail vector artwork and upload to Cloudinary"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Auto-Generate Artwork</span>
                    </button>
                  )}
                </div>

                <p className="text-[11px] text-slate-500">
                  {currentPublicId ? (
                    <span className="font-mono text-[10px] text-slate-400 truncate block max-w-xs">
                      ID: {currentPublicId}
                    </span>
                  ) : selectedFile ? (
                    <span>Selected: {selectedFile.name} (ready to upload)</span>
                  ) : (
                    <span>Upload a product photo to display in catalog, POS and receipts.</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* SKU and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                SKU <span className="text-rose-500">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value.toUpperCase())}
                  placeholder="e.g. GROC-001"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:outline-hidden focus:ring-2 focus:ring-slate-900 uppercase"
                  required
                />
                {!isEditing && (
                  <button
                    type="button"
                    onClick={generateRandomSku}
                    title="Generate Random SKU"
                    className="px-2.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-colors shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Unit of Measure</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="pcs">Pieces (pcs)</option>
                <option value="kg">Kilogram (kg)</option>
                <option value="g">Gram (g)</option>
                <option value="box">Box (box)</option>
                <option value="bottle">Bottle (bottle)</option>
                <option value="tetra">Tetra Pack (tetra)</option>
                <option value="pouch">Pouch (pouch)</option>
                <option value="jar">Jar (jar)</option>
                <option value="bag">Bag (bag)</option>
              </select>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">
              Product Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Organic Basmati Rice (5kg)"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          {/* Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="new">+ Custom Category</option>
              </select>
            </div>

            {category === 'new' && (
              <div>
                <label className="block font-medium text-slate-700 mb-1">New Category Name</label>
                <input
                  type="text"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  placeholder="e.g. Bakery & Sweets"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            )}
          </div>

          {/* Prices */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Purchase Cost (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">
                Selling Price (₹) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                required
              />
            </div>
          </div>

          {/* Stock & Reorder */}
          <div className="grid grid-cols-2 gap-4">
            {!isEditing && (
              <div>
                <label className="block font-medium text-slate-700 mb-1">Initial Opening Stock</label>
                <input
                  type="number"
                  min="0"
                  value={availableStock}
                  onChange={(e) => setAvailableStock(e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                />
              </div>
            )}

            <div className={isEditing ? 'col-span-2' : ''}>
              <label className="block font-medium text-slate-700 mb-1">
                Reorder Alert Level <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
                placeholder="10"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono tabular-nums focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                required
              />
              <span className="text-[11px] text-slate-500">Alert triggers when stock ≤ this number</span>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Product Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Package specifications, barcode notes, shelf location..."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={loading || uploadingImage}
              className="px-4 py-2 text-xs font-medium text-slate-700 hover:text-slate-900 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || uploadingImage}
              className="px-4 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
            >
              {(loading || uploadingImage) && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{loading ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
