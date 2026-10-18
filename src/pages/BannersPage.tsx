import React, { useState, useEffect, useRef, useMemo } from 'react';
import { HeroBanner } from '../types/index.ts';
import { api } from '../api/client.ts';
import {
  Sparkles,
  Zap,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Flame,
  Star,
  Plus,
  RefreshCw,
  Edit2,
  Trash2,
  Upload,
  ArrowUp,
  ArrowDown,
  Check,
  X,
  AlertTriangle,
  ImageIcon,
  Eye,
  Sliders,
  Store,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  Search,
  Filter
} from 'lucide-react';

interface BannersPageProps {
  onSwitchToCustomerStore?: () => void;
}

// Icon dictionary for badge selection and display
const BADGE_ICONS: Record<string, React.FC<{ className?: string }>> = {
  Sparkles,
  Zap,
  Heart,
  ShieldCheck,
  ShoppingBag,
  Tag,
  Flame,
  Star
};

// Preset styling palettes for quick selection
const GRADIENT_PRESETS = [
  {
    name: 'Forest Emerald',
    value: 'from-[#032419] via-[#053827] to-[#074732]',
    accent: '#a3e635'
  },
  {
    name: 'Midnight Tech',
    value: 'from-[#0a1526] via-[#0f2438] to-[#07362a]',
    accent: '#34d399'
  },
  {
    name: 'Warm Harvest',
    value: 'from-[#1c130b] via-[#2d1e11] to-[#0d3024]',
    accent: '#f59e0b'
  },
  {
    name: 'Sparkling Teal',
    value: 'from-[#032520] via-[#083a32] to-[#04281f]',
    accent: '#2dd4bf'
  },
  {
    name: 'Deep Pine',
    value: 'from-[#032016] via-[#063827] to-[#0a4834]',
    accent: '#a3e635'
  },
  {
    name: 'Ruby Dusk',
    value: 'from-[#2a0812] via-[#3d0c1b] to-[#1a050b]',
    accent: '#fb7185'
  },
  {
    name: 'Royal Sapphire',
    value: 'from-[#0b192c] via-[#1e3e62] to-[#000000]',
    accent: '#60a5fa'
  }
];

const ACCENT_COLOR_PRESETS = [
  '#a3e635', // Lime
  '#34d399', // Emerald
  '#2dd4bf', // Teal
  '#f59e0b', // Amber
  '#38bdf8', // Sky
  '#fb7185', // Rose
  '#c084fc', // Purple
  '#f43f5e'  // Crimson
];

const BG_COLOR_PRESETS = [
  { name: 'Deep Forest', value: '#021811' },
  { name: 'Pure Black', value: '#000000' },
  { name: 'Dark Slate', value: '#0f172a' },
  { name: 'Midnight Navy', value: '#0b192c' },
  { name: 'Charcoal', value: '#18181b' },
  { name: 'Emerald Night', value: '#042419' }
];

export const BannersPage: React.FC<BannersPageProps> = ({ onSwitchToCustomerStore }) => {
  const [banners, setBanners] = useState<HeroBanner[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<Partial<HeroBanner> | null>(null);
  const [bannerMode, setBannerMode] = useState<'image-only' | 'custom'>('image-only');
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [modalSaving, setModalSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // File upload state for editor
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete confirm modal
  const [bannerToDelete, setBannerToDelete] = useState<HeroBanner | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset defaults modal
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'image-only' | 'custom'>('all');

  // Compute filtered banners
  const filteredBanners = useMemo(() => {
    return banners.filter((banner) => {
      // Status filter
      if (statusFilter === 'active' && !banner.isActive) return false;
      if (statusFilter === 'inactive' && banner.isActive) return false;

      // Type / mode filter
      const isImgOnly = banner.mode === 'image-only' || (Boolean(banner.imageUrl) && !banner.description && !banner.badgeText);
      if (typeFilter === 'image-only' && !isImgOnly) return false;
      if (typeFilter === 'custom' && isImgOnly) return false;

      // Search query filter (searches title, description, badgeText, categoryKey, ctaText)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = banner.title?.toLowerCase().includes(q);
        const matchDesc = banner.description?.toLowerCase().includes(q);
        const matchBadge = banner.badgeText?.toLowerCase().includes(q);
        const matchCat = banner.categoryKey?.toLowerCase().includes(q);
        const matchCta = banner.ctaText?.toLowerCase().includes(q);
        return Boolean(matchTitle || matchDesc || matchBadge || matchCat || matchCta);
      }

      return true;
    });
  }, [banners, searchQuery, statusFilter, typeFilter]);

  const isFilterActive = searchQuery.trim() !== '' || statusFilter !== 'all' || typeFilter !== 'all';

  const handleClearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  // Fetch all banners including inactive ones
  const fetchBanners = async () => {
    setLoading(true);
    setError(null);
    try {
      const [bannersRes, catRes] = await Promise.all([
        api.getBanners(true),
        api.getCategories().catch(() => ({ categories: [] }))
      ]);
      setBanners(bannersRes.banners || []);
      setCategories(catRes.categories || []);
    } catch (err: any) {
      console.error('Error fetching banners:', err);
      setError(err.message || 'Failed to load promotional banners');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBanners();
  }, []);

  // Show transient success message
  const triggerSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => {
      setSuccessMessage(null);
    }, 4000);
  };

  // Toggle active status
  const handleToggleActive = async (banner: HeroBanner) => {
    const updatedStatus = !banner.isActive;
    try {
      await api.updateBanner(banner._id, { isActive: updatedStatus });
      setBanners((prev) =>
        prev.map((b) => (b._id === banner._id ? { ...b, isActive: updatedStatus } : b))
      );
      triggerSuccess(
        `Banner "${banner.title}" is now ${updatedStatus ? 'LIVE on storefront' : 'hidden from customers'}.`
      );
    } catch (err: any) {
      setError(err.message || 'Failed to update banner status');
    }
  };

  // Move up in order
  const handleMoveUp = async (index: number) => {
    if (index === 0) return;
    const newBanners = [...banners];
    const temp = newBanners[index - 1];
    newBanners[index - 1] = newBanners[index];
    newBanners[index] = temp;

    const orderedIds = newBanners.map((b) => b._id);
    try {
      const res = await api.reorderBanners(orderedIds);
      setBanners(res.banners);
      triggerSuccess('Banner order updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to reorder banners');
    }
  };

  // Move down in order
  const handleMoveDown = async (index: number) => {
    if (index === banners.length - 1) return;
    const newBanners = [...banners];
    const temp = newBanners[index + 1];
    newBanners[index + 1] = newBanners[index];
    newBanners[index] = temp;

    const orderedIds = newBanners.map((b) => b._id);
    try {
      const res = await api.reorderBanners(orderedIds);
      setBanners(res.banners);
      triggerSuccess('Banner order updated successfully.');
    } catch (err: any) {
      setError(err.message || 'Failed to reorder banners');
    }
  };

  // Open Create Modal
  const openCreateModal = () => {
    setIsCreatingNew(true);
    setBannerMode('image-only');
    setSelectedFile(null);
    setImagePreview(null);
    setModalError(null);
    setEditingBanner({
      mode: 'image-only',
      title: '',
      description: '',
      badgeText: 'Curated Daily Retail',
      badgeIcon: 'Sparkles',
      categoryKey: 'all',
      ctaText: 'Shop All Products',
      accentColor: '#a3e635',
      backgroundGradient: 'from-[#032419] via-[#053827] to-[#074732]',
      backgroundColor: '#021811',
      sortOrder: (banners.reduce((max, b) => Math.max(max, b.sortOrder || 0), 0) || 0) + 1,
      isActive: false
    });
    setIsEditModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (banner: HeroBanner) => {
    setIsCreatingNew(false);
    const mode = banner.mode || (banner.imageUrl && !banner.description ? 'image-only' : 'custom');
    setBannerMode(mode);
    setSelectedFile(null);
    setImagePreview(banner.imageUrl || null);
    setModalError(null);
    setEditingBanner({
      ...banner,
      mode,
      backgroundColor: banner.backgroundColor || '#021811'
    });
    setIsEditModalOpen(true);
  };

  // Handle image file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setModalError('Please upload a valid image file (JPEG, PNG, WebP, GIF).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setModalError('File size exceeds the 5MB limit.');
      return;
    }

    setSelectedFile(file);
    setModalError(null);

    // Create immediate local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Handle remove image in modal
  const handleRemoveImageFromModal = async () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (editingBanner && !isCreatingNew && editingBanner._id && editingBanner.imageUrl) {
      try {
        await api.removeBannerImage(editingBanner._id);
        setEditingBanner((prev) => (prev ? { ...prev, imageUrl: undefined, imagePublicId: undefined } : null));
        triggerSuccess('Banner image removed.');
      } catch (err: any) {
        setModalError(err.message || 'Failed to remove image from cloud storage.');
      }
    } else {
      setEditingBanner((prev) => (prev ? { ...prev, imageUrl: undefined, imagePublicId: undefined } : null));
    }
  };

  // Save Banner (Create or Edit)
  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBanner) return;

    if (bannerMode === 'image-only') {
      // Must have either an uploaded file selected or an existing imageUrl
      if (!selectedFile && !editingBanner.imageUrl) {
        setModalError('Please upload a complete banner image file (JPEG, PNG, WebP).');
        return;
      }
    } else {
      // Custom mode: title and description required
      if (!editingBanner.title?.trim()) {
        setModalError('Banner headline / title is required for custom banners.');
        return;
      }

      if (!editingBanner.description?.trim()) {
        setModalError('Banner description copy is required for custom banners.');
        return;
      }
    }

    setModalSaving(true);
    setModalError(null);

    try {
      let savedBanner: HeroBanner;
      const isImgOnly = bannerMode === 'image-only';

      const bannerPayload: Partial<HeroBanner> = {
        mode: bannerMode,
        title: editingBanner.title?.trim() || (isImgOnly ? 'Promotional Banner' : 'Special Promotion'),
        description: isImgOnly ? '' : (editingBanner.description?.trim() || ''),
        badgeText: isImgOnly ? '' : (editingBanner.badgeText?.trim() || 'Featured Promotion'),
        badgeIcon: editingBanner.badgeIcon || 'Sparkles',
        categoryKey: editingBanner.categoryKey || 'all',
        ctaText: isImgOnly ? '' : (editingBanner.ctaText?.trim() || 'Shop Now'),
        accentColor: editingBanner.accentColor || '#a3e635',
        backgroundGradient: editingBanner.backgroundGradient || 'from-[#032419] via-[#053827] to-[#074732]',
        backgroundColor: editingBanner.backgroundColor || '#021811',
        sortOrder: editingBanner.sortOrder || 1,
        isActive: editingBanner.isActive ?? false
      };

      if (isCreatingNew) {
        // Create new banner record
        const createRes = await api.createBanner(bannerPayload);
        savedBanner = createRes.banner;

        // If an image was selected, upload it
        if (selectedFile) {
          const uploadRes = await api.uploadBannerImage(savedBanner._id, selectedFile);
          savedBanner = uploadRes.banner;
        }

        setBanners((prev) => [...prev, savedBanner]);
        triggerSuccess(`Banner "${savedBanner.title}" created successfully.`);
      } else {
        // Update existing banner
        const updateRes = await api.updateBanner(editingBanner._id!, bannerPayload);
        savedBanner = updateRes.banner;

        // If a new image was selected, upload it
        if (selectedFile) {
          const uploadRes = await api.uploadBannerImage(savedBanner._id, selectedFile);
          savedBanner = uploadRes.banner;
        }

        setBanners((prev) =>
          prev.map((b) => (b._id === savedBanner._id ? savedBanner : b))
        );
        triggerSuccess(`Banner "${savedBanner.title}" updated successfully.`);
      }

      setIsEditModalOpen(false);
      setEditingBanner(null);
      setSelectedFile(null);
      setImagePreview(null);
    } catch (err: any) {
      console.error('Error saving banner:', err);
      setModalError(err.message || 'Failed to save banner. Please check details.');
    } finally {
      setModalSaving(false);
    }
  };

  // Delete Banner
  const handleConfirmDelete = async () => {
    if (!bannerToDelete) return;
    setIsDeleting(true);
    try {
      await api.deleteBanner(bannerToDelete._id);
      setBanners((prev) => prev.filter((b) => b._id !== bannerToDelete._id));
      triggerSuccess(`Banner "${bannerToDelete.title}" deleted.`);
      setBannerToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete banner');
    } finally {
      setIsDeleting(false);
    }
  };

  // Reset to default starter banners
  const handleConfirmReset = async () => {
    setIsResetting(true);
    try {
      const res = await api.resetDefaultBanners();
      setBanners(res.banners);
      triggerSuccess('All 5 starter banners restored to defaults.');
      setIsResetConfirmOpen(false);
    } catch (err: any) {
      setError(err.message || 'Failed to restore default banners');
    } finally {
      setIsResetting(false);
    }
  };

  const activeCount = banners.filter((b) => b.isActive).length;
  const inactiveCount = banners.length - activeCount;

  // Render preview badge icon
  const renderIcon = (iconName?: string, className = 'w-4 h-4') => {
    const Component = (iconName && BADGE_ICONS[iconName]) || Sparkles;
    return <Component className={className} />;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Bar with stats and actions */}
      <div className="bg-white rounded-2xl border border-stone-200/80 p-5 sm:p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-emerald-50 text-[#064e3b] border border-emerald-100">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  Hero Promotional Banners
                </h1>
                <p className="text-xs sm:text-sm text-stone-500">
                  Manage the promotional image carousel displayed above the customer storefront catalog.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {onSwitchToCustomerStore && (
              <button
                type="button"
                onClick={onSwitchToCustomerStore}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:border-stone-300 text-stone-700 bg-stone-50 hover:bg-stone-100 font-semibold text-xs transition-colors cursor-pointer"
                title="View how banners look on customer storefront"
              >
                <Store className="w-3.5 h-3.5 text-[#064e3b]" />
                <span>Storefront</span>
                <ExternalLink className="w-3 h-3 text-stone-400" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsResetConfirmOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-stone-200 hover:border-stone-300 text-stone-600 hover:text-stone-900 bg-white font-semibold text-xs transition-colors cursor-pointer"
              title="Reset to 5 default curated slides"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white font-bold text-xs shadow-xs hover:shadow-md transition-all active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-lime-400" />
              <span>Add New Banner</span>
            </button>
          </div>
        </div>

        {/* Status Messages */}
        {successMessage && (
          <div className="mt-4 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-xs text-emerald-800">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="font-semibold">{successMessage}</span>
            </div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {error && (
          <div className="mt-4 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between text-xs text-rose-800">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-700 hover:text-rose-950 p-1"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Metric Badges Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-stone-100">
          <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-100">
            <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
              Total Banners
            </div>
            <div className="text-xl font-black text-stone-900 mt-0.5">{banners.length}</div>
          </div>

          <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
            <div className="text-[11px] font-medium text-emerald-700 uppercase tracking-wider">
              Active on Storefront
            </div>
            <div className="text-xl font-black text-emerald-900 mt-0.5">{activeCount}</div>
          </div>

          <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
            <div className="text-[11px] font-medium text-amber-700 uppercase tracking-wider">
              Hidden / Drafts
            </div>
            <div className="text-xl font-black text-amber-900 mt-0.5">{inactiveCount}</div>
          </div>

          <div className="p-3 bg-stone-50/80 rounded-xl border border-stone-100 flex items-center justify-between">
            <div>
              <div className="text-[11px] font-medium text-stone-500 uppercase tracking-wider">
                Cloudinary Storage
              </div>
              <div className="text-xs font-bold text-stone-800 mt-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Active & Ready</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Banners List */}
      <div className="bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs">
        {/* Card Header */}
        <div className="p-4 sm:p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm sm:text-base font-extrabold text-stone-900">
              Carousel Slides ({isFilterActive ? `${filteredBanners.length} of ${banners.length}` : banners.length})
            </h2>
            <span className="text-xs text-stone-400 font-mono hidden sm:inline-block">
              Ordered by display sequence
            </span>
          </div>
          <button
            type="button"
            onClick={fetchBanners}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors cursor-pointer"
            title="Refresh list"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search and Filter Bar */}
        <div className="p-3 sm:p-4 bg-stone-50/70 border-b border-stone-200/70 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-lg">
            <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search banners by title, description, or badge..."
              className="w-full pl-9 pr-8 py-2 rounded-xl border border-stone-300 bg-white text-xs sm:text-sm text-stone-900 placeholder:text-stone-400 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700 p-0.5 rounded-md hover:bg-stone-100 transition-colors cursor-pointer"
                title="Clear search input"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdowns and Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Status Filter */}
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-stone-400 shrink-0 hidden sm:inline-block" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
                className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] cursor-pointer shadow-2xs"
                aria-label="Filter banners by status"
              >
                <option value="all">All Statuses ({banners.length})</option>
                <option value="active">Active ({activeCount})</option>
                <option value="inactive">Hidden ({inactiveCount})</option>
              </select>
            </div>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as 'all' | 'image-only' | 'custom')}
              className="px-3 py-2 rounded-xl border border-stone-300 bg-white text-xs font-semibold text-stone-800 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b] focus:border-[#064e3b] cursor-pointer shadow-2xs"
              aria-label="Filter banners by mode"
            >
              <option value="all">All Modes</option>
              <option value="image-only">Option A: Image Only</option>
              <option value="custom">Option B: Custom Banner</option>
            </select>

            {/* Reset Filters Button */}
            {isFilterActive && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl border border-stone-300 bg-white hover:bg-stone-100 text-stone-700 hover:text-stone-900 text-xs font-bold transition-colors cursor-pointer shadow-2xs"
                title="Clear search and all filters"
              >
                <X className="w-3 h-3 text-stone-500" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>

        {/* Active Filters Context Banner */}
        {isFilterActive && (
          <div className="px-4 py-2.5 bg-emerald-50/60 border-b border-emerald-100 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-600">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-stone-900">
                Found {filteredBanners.length} {filteredBanners.length === 1 ? 'banner' : 'banners'}
              </span>
              {searchQuery.trim() && (
                <span className="text-stone-500">
                  matching &ldquo;<strong className="text-stone-800">{searchQuery}</strong>&rdquo;
                </span>
              )}
              {statusFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-emerald-800 border border-emerald-200 shadow-2xs">
                  Status: {statusFilter === 'active' ? 'Active Only' : 'Hidden / Drafts'}
                </span>
              )}
              {typeFilter !== 'all' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white text-purple-800 border border-purple-200 shadow-2xs">
                  Mode: {typeFilter === 'image-only' ? 'Image Only' : 'Custom Banner'}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={handleClearFilters}
              className="text-xs font-bold text-[#064e3b] hover:text-[#043d2e] hover:underline cursor-pointer"
            >
              Clear filters
            </button>
          </div>
        )}

        {loading ? (
          <div className="p-12 text-center text-stone-400 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#064e3b]" />
            Loading promotional banners...
          </div>
        ) : banners.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center mx-auto text-stone-400">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-stone-700">No Banners Configured</h3>
            <p className="text-xs text-stone-500 max-w-sm mx-auto">
              Create your first promotional banner or restore the 5 curated starter templates.
            </p>
            <div className="pt-2 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(true)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl cursor-pointer"
              >
                Restore 5 Starter Templates
              </button>
              <button
                type="button"
                onClick={openCreateModal}
                className="px-4 py-2 bg-[#064e3b] text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Create Custom Banner
              </button>
            </div>
          </div>
        ) : filteredBanners.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100 flex items-center justify-center mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <h3 className="text-base font-extrabold text-stone-900">No Banners Match Your Criteria</h3>
            <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
              {searchQuery.trim()
                ? `No promotional banners match "${searchQuery}". Check for typos or try clearing your search and filters.`
                : 'No promotional banners match the selected status or mode filters.'}
            </p>
            <div className="pt-1">
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs font-bold shadow-xs cursor-pointer transition-colors"
              >
                <X className="w-3.5 h-3.5 text-lime-400" />
                <span>Clear Search & Filters</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filteredBanners.map((banner) => {
              const originalIndex = banners.findIndex((b) => b._id === banner._id);
              const isFirst = originalIndex === 0;
              const isLast = originalIndex === banners.length - 1;

              return (
                <div
                  key={banner._id}
                  className={`p-4 sm:p-5 transition-colors hover:bg-stone-50/60 ${
                    !banner.isActive ? 'bg-stone-50/40 opacity-75' : ''
                  }`}
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Left: Reorder & Mini Visual Preview */}
                    <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                      {/* Reorder Arrows */}
                      <div className="flex flex-col items-center gap-1">
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveUp(originalIndex)}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-25 disabled:hover:text-stone-400 cursor-pointer transition-colors"
                          title="Move slide earlier in carousel"
                          aria-label="Move slide up"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        <span className="text-xs font-mono font-bold text-stone-400">
                          #{originalIndex + 1}
                        </span>
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveDown(originalIndex)}
                          className="p-1 text-stone-400 hover:text-stone-700 disabled:opacity-25 disabled:hover:text-stone-400 cursor-pointer transition-colors"
                          title="Move slide later in carousel"
                          aria-label="Move slide down"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Mini Visual Slide Card */}
                      {banner.mode === 'image-only' && banner.imageUrl ? (
                        <div
                          className="w-36 sm:w-44 h-24 rounded-xl overflow-hidden relative shadow-sm border border-stone-800/30 flex items-center justify-center p-1.5 shrink-0 select-none"
                          style={{ backgroundColor: banner.backgroundColor || '#021811' }}
                        >
                          <img
                            src={banner.imageUrl}
                            alt={banner.title}
                            className="w-full h-full object-contain"
                          />
                          <div className="absolute top-1 right-1 bg-black/70 backdrop-blur-xs text-[9px] font-bold text-white px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-white/20">
                            <ImageIcon className="w-2.5 h-2.5 text-purple-400" />
                            <span>Image</span>
                          </div>
                        </div>
                      ) : (
                        <div
                          className={`w-36 sm:w-44 h-24 rounded-xl overflow-hidden relative shadow-sm border border-stone-800/20 bg-gradient-to-r ${banner.backgroundGradient} p-2.5 flex flex-col justify-between shrink-0 select-none`}
                        >
                          {/* Glow */}
                          <div
                            className="absolute -top-4 -right-4 w-20 h-20 rounded-full blur-xl opacity-30 pointer-events-none"
                            style={{ backgroundColor: banner.accentColor }}
                          />

                          {/* Top tag */}
                          <div className="flex items-center gap-1 z-10">
                            <span
                              className="p-0.5 rounded-full bg-black/40 text-stone-200"
                              style={{ color: banner.accentColor }}
                            >
                              {renderIcon(banner.badgeIcon, 'w-2.5 h-2.5')}
                            </span>
                            <span className="text-[9px] font-bold text-stone-200 truncate max-w-[100px]">
                              {banner.badgeText}
                            </span>
                          </div>

                          {/* Center/Bottom content */}
                          <div className="z-10 mt-auto">
                            <p className="text-[11px] font-extrabold text-white leading-tight line-clamp-1">
                              {banner.title}
                            </p>
                            <span
                              className="inline-block mt-1 text-[8px] font-extrabold px-1.5 py-0.5 rounded-sm bg-lime-400 text-stone-950"
                              style={{
                                backgroundColor: banner.accentColor || '#a3e635',
                                color: '#09090b'
                              }}
                            >
                              {banner.ctaText}
                            </span>
                          </div>

                          {/* Thumbnail overlay if image uploaded */}
                          {banner.imageUrl && (
                            <div className="absolute right-1 bottom-1 w-12 h-12 rounded-lg overflow-hidden border border-white/20 bg-black/50 z-10">
                              <img
                                src={banner.imageUrl}
                                alt={banner.title}
                                className="w-full h-full object-cover"
                              />
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Middle: Details & Copy */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-stone-900 truncate">
                          {banner.title}
                        </span>

                        {banner.mode === 'image-only' ? (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-purple-600" />
                            Option A: Image Only
                          </span>
                        ) : (
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-blue-600" />
                            Option B: Custom Banner
                          </span>
                        )}

                        {banner.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                            Hidden / Inactive
                          </span>
                        )}

                        {banner.categoryKey && banner.categoryKey !== 'all' && (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-stone-100 text-stone-600 border border-stone-200">
                            Destination: <span className="font-semibold text-stone-900">{banner.categoryKey}</span>
                          </span>
                        )}

                        {banner.imageUrl ? (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                            <ImageIcon className="w-3 h-3 text-teal-600" />
                            Cloudinary
                          </span>
                        ) : (
                          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md bg-lime-50 text-lime-900 border border-lime-200 flex items-center gap-1">
                            <Sparkles className="w-3 h-3 text-lime-700" />
                            Vector Illustration
                          </span>
                        )}
                      </div>

                      {banner.mode === 'image-only' ? (
                        <p className="text-xs text-stone-500 leading-relaxed">
                          Full-width complete promotional banner artwork. Displayed across the entire slide preserving original aspect ratio with no text overlays or duplicated buttons.
                        </p>
                      ) : (
                        <p className="text-xs text-stone-600 line-clamp-2 max-w-2xl leading-relaxed">
                          {banner.description}
                        </p>
                      )}

                      {banner.mode !== 'image-only' && (
                        <div className="flex flex-wrap items-center gap-3 text-[11px] text-stone-400 font-mono pt-0.5">
                          <span>Badge: "{banner.badgeText}"</span>
                          <span>·</span>
                          <span>CTA: "{banner.ctaText}"</span>
                          <span>·</span>
                          <span>Accent: {banner.accentColor}</span>
                        </div>
                      )}
                    </div>

                    {/* Right: Actions */}
                    <div className="flex items-center gap-2 shrink-0 self-end lg:self-center">
                      {/* Active toggle button */}
                      <button
                        type="button"
                        onClick={() => handleToggleActive(banner)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                          banner.isActive
                            ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200'
                        }`}
                        title={banner.isActive ? 'Click to hide from customers' : 'Click to show on storefront'}
                      >
                        {banner.isActive ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Live</span>
                          </>
                        ) : (
                          <>
                            <Eye className="w-3.5 h-3.5 text-stone-500" />
                            <span>Publish</span>
                          </>
                        )}
                      </button>

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => openEditModal(banner)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 font-semibold text-xs transition-colors cursor-pointer"
                        title="Edit headline, description, styling or image"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Edit</span>
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => setBannerToDelete(banner)}
                        className="p-1.5 rounded-xl text-stone-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Delete this banner"
                        aria-label="Delete banner"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Modal: Create / Edit Banner */}
      {isEditModalOpen && editingBanner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full border border-stone-200 shadow-2xl overflow-hidden my-8 max-h-[90vh] flex flex-col">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 border-b border-stone-100 flex items-center justify-between bg-stone-50/50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-emerald-100 text-[#064e3b]">
                  {isCreatingNew ? <Plus className="w-5 h-5" /> : <Edit2 className="w-5 h-5" />}
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-stone-900">
                    {isCreatingNew ? 'Create New Hero Banner' : 'Edit Promotional Banner'}
                  </h3>
                  <p className="text-xs text-stone-500">
                    Customize the banner copy, target category, theme colors, and Cloudinary image.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingBanner(null);
                }}
                className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Scrollable */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
              {modalError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* 1. TWO BANNER MODES SELECTOR: Option A vs Option B */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-stone-700 uppercase tracking-wider font-mono">
                    Select Banner Mode <span className="text-rose-500">*</span>
                  </label>
                  <span className="text-[11px] text-stone-500">Choose how this slide will be constructed</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Option A: Image Only */}
                  <button
                    type="button"
                    onClick={() => {
                      setBannerMode('image-only');
                      setEditingBanner((prev) => (prev ? { ...prev, mode: 'image-only' } : null));
                      setModalError(null);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      bannerMode === 'image-only'
                        ? 'border-[#064e3b] bg-emerald-50/70 ring-2 ring-[#064e3b]/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        bannerMode === 'image-only' ? 'bg-[#064e3b] text-white shadow-xs' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <ImageIcon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-stone-900">Option A: Image Only</span>
                        {bannerMode === 'image-only' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#064e3b] ring-4 ring-emerald-100" />
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        Upload a complete, ready-designed banner artwork. No title, description, or buttons required.
                      </p>
                    </div>
                  </button>

                  {/* Option B: Custom Banner */}
                  <button
                    type="button"
                    onClick={() => {
                      setBannerMode('custom');
                      setEditingBanner((prev) => (prev ? { ...prev, mode: 'custom' } : null));
                      setModalError(null);
                    }}
                    className={`p-4 rounded-2xl border-2 text-left transition-all cursor-pointer flex items-start gap-3.5 ${
                      bannerMode === 'custom'
                        ? 'border-[#064e3b] bg-emerald-50/70 ring-2 ring-[#064e3b]/20 shadow-xs'
                        : 'border-stone-200 hover:border-stone-300 bg-white hover:bg-stone-50'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl shrink-0 ${
                        bannerMode === 'custom' ? 'bg-[#064e3b] text-white shadow-xs' : 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      <Sliders className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-extrabold text-stone-900">Option B: Custom Banner</span>
                        {bannerMode === 'custom' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-[#064e3b] ring-4 ring-emerald-100" />
                        )}
                      </div>
                      <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                        Customize headline, description copy, badge icon, CTA button, target category, and theme colors.
                      </p>
                    </div>
                  </button>
                </div>
              </div>

              {/* 2. LIVE INTERACTIVE STOREFRONT PREVIEW */}
              <div className="space-y-1.5 pt-1 border-t border-stone-100">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-stone-500 font-mono">
                    Live Storefront Slide Preview
                  </span>
                  <span className="text-[11px] text-stone-400">
                    {bannerMode === 'image-only' ? 'Full-width artwork mode' : 'Custom split text-and-image mode'}
                  </span>
                </div>

                {bannerMode === 'image-only' ? (
                  /* Option A Live Preview: Full-Width Artwork */
                  <div
                    className="w-full rounded-2xl overflow-hidden relative shadow-md p-3 sm:p-4 flex items-center justify-center min-h-[190px] max-h-[260px] border border-stone-900"
                    style={{ backgroundColor: editingBanner.backgroundColor || '#021811' }}
                  >
                    {imagePreview ? (
                      <img
                        src={imagePreview}
                        alt="Storefront Image-Only Preview"
                        className="w-full h-full max-h-[230px] object-contain object-center rounded-lg shadow-sm"
                      />
                    ) : (
                      <div className="text-center p-6 text-stone-400 space-y-2 select-none">
                        <ImageIcon className="w-10 h-10 mx-auto text-stone-600 opacity-60" />
                        <p className="text-xs font-bold text-stone-300">No promotional artwork uploaded yet</p>
                        <p className="text-[11px] text-stone-400 max-w-sm mx-auto">
                          Upload your ready-designed banner image below to preview how it will render full-width across the storefront.
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Option B Live Preview: Custom Banner */
                  <div
                    className={`w-full rounded-2xl overflow-hidden relative shadow-md bg-gradient-to-r ${editingBanner.backgroundGradient} p-5 sm:p-6 min-h-[170px] flex flex-col justify-between`}
                  >
                    {/* Subtle Glow */}
                    <div
                      className="absolute -top-10 -right-10 w-44 h-44 rounded-full blur-2xl opacity-30 pointer-events-none"
                      style={{ backgroundColor: editingBanner.accentColor }}
                    />

                    {/* Kicker badge */}
                    <div className="flex items-center gap-2 z-10">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[11px] font-bold backdrop-blur-xs bg-black/40 border-white/20 text-stone-200">
                        {renderIcon(editingBanner.badgeIcon || 'Sparkles', 'w-3 h-3')}
                        <span>{editingBanner.badgeText || 'Badge Headline'}</span>
                      </span>
                    </div>

                    {/* Headline & Description */}
                    <div className="z-10 my-2 max-w-lg">
                      <h4 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                        {editingBanner.title || 'Enter your headline title...'}
                      </h4>
                      <p className="text-xs text-stone-300 mt-1 line-clamp-2 leading-relaxed">
                        {editingBanner.description || 'Describe your promotion, catalog highlight, or seasonal offer...'}
                      </p>
                    </div>

                    {/* CTA & Optional Image */}
                    <div className="flex items-center justify-between z-10 pt-1">
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-black shadow-sm"
                        style={{
                          backgroundColor: editingBanner.accentColor || '#a3e635',
                          color: '#09090b'
                        }}
                      >
                        <span>{editingBanner.ctaText || 'Shop Now'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>

                      {imagePreview && (
                        <div className="w-16 h-14 rounded-xl overflow-hidden border border-white/30 bg-black/40 shadow-inner">
                          <img
                            src={imagePreview}
                            alt="Banner Preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 3. FORM FIELDS */}
              <form id="banner-form" onSubmit={handleSaveBanner} className="space-y-4 pt-1 border-t border-stone-100">
                {bannerMode === 'image-only' ? (
                  /* ========================================================
                     OPTION A: IMAGE ONLY FORM FIELDS
                     No headline, description, badge, CTA, or color controls required!
                     ======================================================== */
                  <div className="space-y-4">
                    {/* Big Prominent Image Upload Area */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block text-xs font-bold text-stone-800">
                          Complete Promotional Banner Artwork <span className="text-rose-500">*</span>
                        </label>
                        <span className="text-[11px] text-stone-500">JPEG, PNG, WebP or GIF up to 5MB</span>
                      </div>

                      <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-6 sm:p-8 rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center text-center ${
                          imagePreview
                            ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400'
                            : 'border-stone-300 bg-stone-50 hover:bg-stone-100/80 hover:border-stone-400'
                        }`}
                      >
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          onChange={handleFileChange}
                          className="hidden"
                          id="banner-image-input"
                        />

                        {imagePreview ? (
                          <div className="space-y-3 w-full flex flex-col items-center">
                            <div className="max-w-md w-full aspect-[21/9] rounded-xl overflow-hidden border border-stone-300 bg-stone-900 shadow-sm flex items-center justify-center p-1">
                              <img
                                src={imagePreview}
                                alt="Selected banner artwork"
                                className="w-full h-full object-contain"
                              />
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  fileInputRef.current?.click();
                                }}
                                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-bold shadow-xs cursor-pointer"
                              >
                                <Upload className="w-3.5 h-3.5" />
                                <span>Change Artwork</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImageFromModal();
                                }}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1 cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2 py-4">
                            <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-[#064e3b] border border-emerald-100 flex items-center justify-center mx-auto shadow-xs">
                              <Upload className="w-7 h-7" />
                            </div>
                            <div className="text-sm font-bold text-stone-800">
                              Click or drag and drop to upload banner image
                            </div>
                            <p className="text-xs text-stone-500 max-w-sm mx-auto">
                              Upload your finished marketing artwork. It will be stored securely on Cloudinary and displayed full-width across the hero carousel.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Optional Internal Label for Admin table */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Internal Banner Title / Label <span className="text-stone-400 font-normal">(Optional)</span>
                        </label>
                        <input
                          type="text"
                          value={editingBanner.title || ''}
                          onChange={(e) =>
                            setEditingBanner((prev) => (prev ? { ...prev, title: e.target.value } : null))
                          }
                          placeholder="e.g. Summer Promo Artwork (defaults to Promotional Banner)"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b]"
                        />
                        <p className="text-[10px] text-stone-400 mt-1">
                          Only used for your reference in the Admin dashboard list. Never shown to customers.
                        </p>
                      </div>

                      {/* Optional Target Category destination */}
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Click Destination <span className="text-stone-400 font-normal">(Optional)</span>
                        </label>
                        <select
                          value={editingBanner.categoryKey || 'all'}
                          onChange={(e) =>
                            setEditingBanner((prev) => (prev ? { ...prev, categoryKey: e.target.value } : null))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b]"
                        >
                          <option value="all">All Products (Full Store Catalog)</option>
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-stone-400 mt-1">
                          When a customer clicks anywhere on this banner, filter to this category.
                        </p>
                      </div>
                    </div>

                    {/* Background Color for Unused Space / Letterboxing */}
                    <div className="pt-2 border-t border-stone-100">
                      <label className="block text-xs font-bold text-stone-700 mb-1.5">
                        Letterbox Background Color
                      </label>
                      <p className="text-[11px] text-stone-500 mb-2">
                        Fills any letterbox space around the artwork to preserve its natural aspect ratio cleanly.
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {BG_COLOR_PRESETS.map((bg) => (
                          <button
                            key={bg.value}
                            type="button"
                            onClick={() =>
                              setEditingBanner((prev) =>
                                prev ? { ...prev, backgroundColor: bg.value } : null
                              )
                            }
                            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                              editingBanner.backgroundColor === bg.value
                                ? 'border-[#064e3b] ring-2 ring-[#064e3b]/30 bg-emerald-50 text-stone-900 font-bold'
                                : 'border-stone-200 hover:border-stone-300 bg-white text-stone-700'
                            }`}
                          >
                            <span
                              className="w-3.5 h-3.5 rounded-full border border-black/30 shadow-xs shrink-0"
                              style={{ backgroundColor: bg.value }}
                            />
                            <span>{bg.name}</span>
                          </button>
                        ))}
                        <input
                          type="text"
                          value={editingBanner.backgroundColor || '#021811'}
                          onChange={(e) =>
                            setEditingBanner((prev) =>
                              prev ? { ...prev, backgroundColor: e.target.value } : null
                            )
                          }
                          className="w-24 px-2 py-1 rounded-lg border border-stone-300 text-xs font-mono text-stone-800"
                          placeholder="#021811"
                        />
                      </div>
                    </div>

                    {/* Publication Status Toggle */}
                    <div className="pt-2 border-t border-stone-100">
                      <label className="flex items-center gap-2.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={editingBanner.isActive ?? false}
                          onChange={(e) =>
                            setEditingBanner((prev) =>
                              prev ? { ...prev, isActive: e.target.checked } : null
                            )
                          }
                          className="w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b]"
                        />
                        <span className="text-xs font-bold text-stone-800">
                          Active & Visible in Customer Carousel
                        </span>
                      </label>
                      <p className="text-[11px] text-stone-500 ml-6 mt-0.5">
                        When active, this promotional image will immediately rotate in the customer storefront carousel.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* ========================================================
                     OPTION B: CUSTOM BANNER FORM FIELDS
                     Retains all existing copy, badge, category, CTA, and color options!
                     ======================================================== */
                  <div className="space-y-4">
                    {/* 1. Headline & Description */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Headline Title <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={editingBanner.title || ''}
                          onChange={(e) =>
                            setEditingBanner((prev) => (prev ? { ...prev, title: e.target.value } : null))
                          }
                          placeholder="e.g. Fresh Daily Farm Staples, Upgrade Your Home..."
                          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-300 text-xs sm:text-sm text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Description Copy <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={2}
                          required
                          value={editingBanner.description || ''}
                          onChange={(e) =>
                            setEditingBanner((prev) => (prev ? { ...prev, description: e.target.value } : null))
                          }
                          placeholder="Clear explanation of the promotion or product range shown on the slide..."
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b]"
                        />
                      </div>
                    </div>

                    {/* 2. Badge & Icon */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Badge Text
                        </label>
                        <input
                          type="text"
                          value={editingBanner.badgeText || ''}
                          onChange={(e) =>
                            setEditingBanner((prev) => (prev ? { ...prev, badgeText: e.target.value } : null))
                          }
                          placeholder="e.g. 100% Organic, Verified Catalog..."
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b]"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Badge Icon
                        </label>
                        <select
                          value={editingBanner.badgeIcon || 'Sparkles'}
                          onChange={(e) =>
                            setEditingBanner((prev) => (prev ? { ...prev, badgeIcon: e.target.value } : null))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b]"
                        >
                          {Object.keys(BADGE_ICONS).map((iconName) => (
                            <option key={iconName} value={iconName}>
                              {iconName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* 3. Category Link & CTA Text */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          Target Store Category
                        </label>
                        <select
                          value={editingBanner.categoryKey || 'all'}
                          onChange={(e) =>
                            setEditingBanner((prev) => (prev ? { ...prev, categoryKey: e.target.value } : null))
                          }
                          className="w-full px-3 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b]"
                        >
                          <option value="all">All Products (Full Store Catalog)</option>
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <p className="text-[10px] text-stone-400 mt-1">
                          Clicking the banner CTA will filter the storefront catalog to this category.
                        </p>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1">
                          CTA Button Text
                        </label>
                        <input
                          type="text"
                          value={editingBanner.ctaText || ''}
                          onChange={(e) =>
                            setEditingBanner((prev) => (prev ? { ...prev, ctaText: e.target.value } : null))
                          }
                          placeholder="e.g. Shop Now, Explore Groceries..."
                          className="w-full px-3.5 py-2 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-hidden focus:ring-2 focus:ring-[#064e3b]"
                        />
                      </div>
                    </div>

                    {/* 4. Color Palette & Gradients */}
                    <div className="space-y-3 pt-2 border-t border-stone-100">
                      <div>
                        <label className="block text-xs font-bold text-stone-700 mb-1.5">
                          Background Gradient Preset
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {GRADIENT_PRESETS.map((preset) => {
                            const isSelected = editingBanner.backgroundGradient === preset.value;
                            return (
                              <button
                                key={preset.name}
                                type="button"
                                onClick={() => {
                                  setEditingBanner((prev) =>
                                    prev
                                      ? {
                                          ...prev,
                                          backgroundGradient: preset.value,
                                          accentColor: preset.accent
                                        }
                                      : null
                                  );
                                }}
                                className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                                  isSelected
                                    ? 'border-[#064e3b] ring-2 ring-[#064e3b]/30'
                                    : 'border-stone-200 hover:border-stone-300'
                                }`}
                              >
                                <div
                                  className={`w-full h-7 rounded-lg bg-gradient-to-r ${preset.value} mb-1 border border-black/20`}
                                />
                                <div className="text-[11px] font-bold text-stone-800 truncate">
                                  {preset.name}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Accent / CTA Color
                          </label>
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1.5">
                              {ACCENT_COLOR_PRESETS.map((color) => (
                                <button
                                  key={color}
                                  type="button"
                                  onClick={() =>
                                    setEditingBanner((prev) => (prev ? { ...prev, accentColor: color } : null))
                                  }
                                  className={`w-6 h-6 rounded-full cursor-pointer transition-transform ${
                                    editingBanner.accentColor === color
                                      ? 'scale-110 ring-2 ring-stone-900 ring-offset-1'
                                      : 'hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: color }}
                                  aria-label={`Select accent color ${color}`}
                                />
                              ))}
                            </div>
                            <input
                              type="text"
                              value={editingBanner.accentColor || '#a3e635'}
                              onChange={(e) =>
                                setEditingBanner((prev) =>
                                  prev ? { ...prev, accentColor: e.target.value } : null
                                )
                              }
                              className="w-20 px-2 py-1 rounded-lg border border-stone-300 text-xs font-mono"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-bold text-stone-700 mb-1">
                            Status on Storefront
                          </label>
                          <label className="flex items-center gap-2 mt-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={editingBanner.isActive ?? true}
                              onChange={(e) =>
                                setEditingBanner((prev) =>
                                  prev ? { ...prev, isActive: e.target.checked } : null
                                )
                              }
                              className="w-4 h-4 rounded text-[#064e3b] focus:ring-[#064e3b]"
                            />
                            <span className="text-xs font-semibold text-stone-800">
                              Active & Visible in Customer Carousel
                            </span>
                          </label>
                        </div>
                      </div>
                    </div>

                    {/* 5. Cloudinary Image Uploader for Custom Banner */}
                    <div className="pt-2 border-t border-stone-100">
                      <label className="block text-xs font-bold text-stone-700 mb-1">
                        Promotional Slide Image (Cloudinary)
                      </label>

                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-stone-50 rounded-2xl border border-dashed border-stone-300">
                        {imagePreview ? (
                          <div className="relative group w-28 h-20 rounded-xl overflow-hidden border border-stone-200 bg-white shrink-0">
                            <img
                              src={imagePreview}
                              alt="Banner upload preview"
                              className="w-full h-full object-cover"
                            />
                            <button
                              type="button"
                              onClick={handleRemoveImageFromModal}
                              className="absolute inset-0 bg-stone-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold"
                            >
                              Remove
                            </button>
                          </div>
                        ) : (
                          <div className="w-28 h-20 rounded-xl border border-stone-200 bg-stone-100 flex flex-col items-center justify-center text-stone-400 shrink-0">
                            <ImageIcon className="w-6 h-6 mb-1" />
                            <span className="text-[10px]">No Image</span>
                          </div>
                        )}

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <input
                              ref={fileInputRef}
                              type="file"
                              accept="image/jpeg,image/png,image/webp,image/gif"
                              onChange={handleFileChange}
                              className="hidden"
                              id="banner-image-input"
                            />
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-stone-300 hover:border-stone-400 bg-white text-stone-800 text-xs font-bold transition-colors cursor-pointer"
                            >
                              <Upload className="w-3.5 h-3.5" />
                              <span>{imagePreview ? 'Change Image' : 'Select Image File'}</span>
                            </button>

                            {imagePreview && (
                              <button
                                type="button"
                                onClick={handleRemoveImageFromModal}
                                className="text-xs text-rose-600 hover:text-rose-800 font-semibold px-2 py-1"
                              >
                                Remove
                              </button>
                            )}
                          </div>
                          <p className="text-[11px] text-stone-500">
                            Accepts JPEG, PNG, WebP or GIF up to 5MB. If no image is uploaded, the slide will automatically display our bespoke editorial vector artwork.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </form>
            </div>

            {/* Modal Footer */}
            <div className="p-4 sm:p-5 border-t border-stone-100 bg-stone-50/50 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setEditingBanner(null);
                }}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                form="banner-form"
                disabled={modalSaving}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs font-bold transition-all shadow-xs cursor-pointer disabled:opacity-50"
              >
                {modalSaving && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>{isCreatingNew ? 'Create Banner' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Modal: Confirm Delete */}
      {bannerToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">Delete Hero Banner?</h3>
                <p className="text-xs text-stone-500">This action cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              Are you sure you want to delete the banner{' '}
              <strong className="text-stone-900 font-bold">"{bannerToDelete.title}"</strong>? If this
              banner has an image on Cloudinary, it will be cleaned up automatically.
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setBannerToDelete(null)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleConfirmDelete}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {isDeleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Delete Banner</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Modal: Confirm Reset to Defaults */}
      {isResetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full border border-stone-200 shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3 text-amber-600">
              <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100">
                <RefreshCw className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-black text-stone-900">Restore 5 Default Templates?</h3>
                <p className="text-xs text-stone-500">Curated daily retail carousel presets.</p>
              </div>
            </div>

            <p className="text-xs text-stone-600 leading-relaxed">
              This will reset the promotional banners list to the 5 standard RetailFlow curated slides
              (Everyday Essentials, Electronics, Groceries, Home Care, and Store Highlights).
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl border border-stone-300 text-stone-700 text-xs font-semibold hover:bg-stone-100"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isResetting}
                onClick={handleConfirmReset}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#064e3b] hover:bg-[#043d2e] text-white text-xs font-bold shadow-xs transition-all disabled:opacity-50"
              >
                {isResetting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Restore Defaults</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
