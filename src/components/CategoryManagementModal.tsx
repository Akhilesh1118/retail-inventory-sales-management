import React, { useEffect, useState } from 'react';
import { Pencil, Plus, Save, Tag, Trash2, X } from 'lucide-react';
import { api } from '../api/client.ts';
import { ProductCategory } from '../types/index.ts';

interface CategoryManagementModalProps {
  onClose: () => void;
  onCategoriesChanged: (categories: ProductCategory[]) => void;
}

export const CategoryManagementModal: React.FC<CategoryManagementModalProps> = ({
  onClose,
  onCategoriesChanged
}) => {
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [newName, setNewName] = useState('');
  const [newShowInPos, setNewShowInPos] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingShowInPos, setEditingShowInPos] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const result = await api.getManagedCategories();
      setCategories(result.categories);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Could not load product categories.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCategories();
  }, []);

  const acceptCategories = (updated: ProductCategory[]) => {
    setCategories(updated);
    onCategoriesChanged(updated);
    setError(null);
  };

  const addCategory = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!newName.trim()) return;
    setSaving(true);
    try {
      const result = await api.createCategory(newName, newShowInPos);
      acceptCategories(result.categories);
      setNewName('');
      setNewShowInPos(true);
    } catch (err: any) {
      setError(err.message || 'Could not add category.');
    } finally {
      setSaving(false);
    }
  };

  const beginEdit = (category: ProductCategory) => {
    setEditingId(category._id);
    setEditingName(category.name);
    setEditingShowInPos(category.showInPos);
    setError(null);
  };

  const saveEdit = async (category: ProductCategory) => {
    setSaving(true);
    try {
      const result = await api.updateCategory(category._id, editingName, editingShowInPos);
      acceptCategories(result.categories);
      setEditingId(null);
    } catch (err: any) {
      setError(err.message || 'Could not update category.');
    } finally {
      setSaving(false);
    }
  };

  const togglePosVisibility = async (category: ProductCategory) => {
    setSaving(true);
    try {
      const result = await api.updateCategory(category._id, category.name, !category.showInPos);
      acceptCategories(result.categories);
    } catch (err: any) {
      setError(err.message || 'Could not update POS visibility.');
    } finally {
      setSaving(false);
    }
  };

  const removeCategory = async (category: ProductCategory) => {
    if (!window.confirm(`Remove the category "${category.name}"? Categories assigned to products must be reassigned first.`)) return;
    setSaving(true);
    try {
      const result = await api.deleteCategory(category._id);
      acceptCategories(result.categories);
    } catch (err: any) {
      setError(err.message || 'Could not remove category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 p-3 sm:p-6" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="category-manager-title"
        className="w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl flex flex-col"
      >
        <header className="flex items-center justify-between gap-4 border-b border-slate-100 px-5 py-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-800"><Tag className="h-5 w-5" /></span>
            <div>
              <h2 id="category-manager-title" className="text-base font-bold text-slate-900">Manage Product Categories</h2>
              <p className="text-xs text-slate-500">Rename categories and choose which ones appear in POS.</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close category manager" className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
        </header>

        <div className="overflow-y-auto p-5 space-y-4">
          {error && <div role="alert" className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{error}</div>}

          <form onSubmit={addCategory} className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-3">
            <label className="block text-xs font-semibold text-slate-700" htmlFor="new-product-category">Add a category</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="new-product-category"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                maxLength={60}
                placeholder="e.g. Personal Care"
                className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-700/30"
              />
              <button type="submit" disabled={saving || !newName.trim()} className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-900 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-50">
                <Plus className="h-4 w-4" /> Add Category
              </button>
            </div>
            <label className="flex items-center gap-2 text-xs text-slate-600">
              <input type="checkbox" checked={newShowInPos} onChange={(event) => setNewShowInPos(event.target.checked)} />
              Show this category in POS
            </label>
          </form>

          <div className="rounded-xl border border-slate-200 overflow-hidden">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 bg-slate-50 px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              <span>Category</span><span>POS visibility / actions</span>
            </div>
            {loading ? <p className="px-4 py-8 text-center text-sm text-slate-500">Loading categories…</p> : categories.length === 0 ? <p className="px-4 py-8 text-center text-sm text-slate-500">No product categories yet.</p> : categories.map((category) => {
              const isEditing = editingId === category._id;
              return (
                <div key={category._id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-t border-slate-100 px-4 py-3">
                  <div className="min-w-0">
                    {isEditing ? (
                      <input value={editingName} onChange={(event) => setEditingName(event.target.value)} maxLength={60} aria-label={`Rename ${category.name}`} className="w-full rounded-lg border border-slate-300 px-2.5 py-1.5 text-sm outline-none focus:ring-2 focus:ring-emerald-700/30" />
                    ) : <p className="truncate text-sm font-semibold text-slate-800">{category.name}</p>}
                    {isEditing && <label className="mt-2 flex items-center gap-2 text-xs text-slate-600"><input type="checkbox" checked={editingShowInPos} onChange={(event) => setEditingShowInPos(event.target.checked)} /> Show in POS</label>}
                  </div>
                  <div className="flex items-center gap-2">
                    {!isEditing && <label className="flex items-center gap-1.5 whitespace-nowrap text-[11px] text-slate-600"><input type="checkbox" checked={category.showInPos} disabled={saving} onChange={() => void togglePosVisibility(category)} /> POS</label>}
                    {isEditing ? <>
                      <button type="button" disabled={saving || !editingName.trim()} onClick={() => void saveEdit(category)} aria-label={`Save ${category.name}`} className="rounded-md p-1.5 text-emerald-800 hover:bg-emerald-50 disabled:opacity-50"><Save className="h-4 w-4" /></button>
                      <button type="button" disabled={saving} onClick={() => setEditingId(null)} aria-label="Cancel category edit" className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><X className="h-4 w-4" /></button>
                    </> : <>
                      <button type="button" disabled={saving} onClick={() => beginEdit(category)} aria-label={`Edit ${category.name}`} className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100"><Pencil className="h-4 w-4" /></button>
                      <button type="button" disabled={saving} onClick={() => void removeCategory(category)} aria-label={`Delete ${category.name}`} className="rounded-md p-1.5 text-rose-600 hover:bg-rose-50"><Trash2 className="h-4 w-4" /></button>
                    </>}
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[11px] leading-relaxed text-slate-500">Renaming a category updates products assigned to it. A category can only be removed after its products are assigned elsewhere.</p>
        </div>

        <footer className="flex justify-end border-t border-slate-100 px-5 py-3">
          <button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">Done</button>
        </footer>
      </section>
    </div>
  );
};
