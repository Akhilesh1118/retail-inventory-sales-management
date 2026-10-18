export type UserRole = 'admin' | 'staff' | 'customer';
export type BannerMode = 'image-only' | 'custom';

export interface IHeroBanner {
  _id: string;
  mode?: BannerMode; // 'image-only' | 'custom' (defaults to 'custom')
  title: string;
  description?: string;
  badgeText?: string;
  badgeIcon?: string; // e.g. Sparkles, Zap, Heart, ShieldCheck, ShoppingBag, Tag, Flame, Star
  categoryKey?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
  imagePublicId?: string;
  accentColor?: string;
  backgroundGradient?: string;
  backgroundColor?: string; // For image-only letterbox/contain background
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IUser {
  _id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface IProduct {
  _id: string;
  sku: string;
  name: string;
  category: string;
  purchasePrice: number; // In minor units or 2 decimals
  sellingPrice: number;
  availableStock: number;
  reorderLevel: number;
  isActive: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  imageSourceUrl?: string;
  imageCredit?: string;
  description?: string;
  unit?: string; // pcs, kg, box, etc.
  taxRatePercent?: number; // Optional product-specific GST slab (e.g. 0, 5, 12, 18, 28)
  createdAt: string;
  updatedAt: string;
}

export interface IProductCategory {
  _id: string;
  name: string;
  showInPos: boolean;
}

export type MovementType =
  | 'STOCK_RECEIVED'
  | 'MANUAL_INCREASE'
  | 'MANUAL_DECREASE'
  | 'SALE'
  | 'SALE_RETURN';

export interface IInventoryMovement {
  _id: string;
  productId: string;
  productSku: string;
  productName: string;
  type: MovementType;
  quantity: number; // positive number representing quantity changed
  previousStock: number;
  resultingStock: number;
  userId: string;
  userName: string;
  reason: string;
  saleId?: string;
  invoiceNumber?: string;
  timestamp: string;
  createdAt: string;
}

export type SaleStatus = 'COMPLETED' | 'RETURNED' | 'CANCELLED';

export interface ISaleItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPurchasePrice: number;
  unitSellingPrice: number;
  lineTotal: number;
  lineProfit: number;
}

export interface ISale {
  _id: string;
  invoiceNumber: string;
  items: ISaleItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  status: SaleStatus;
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
  notes?: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export interface IStoreConfig {
  storeName: string;
  storeAddress: string;
  gstin: string;
  currency: string;
  taxRatePercent: number;
  defaultDiscountPercent: number;
}

export interface AuthTokenPayload {
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
}
