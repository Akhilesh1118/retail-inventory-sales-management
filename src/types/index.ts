export type UserRole = 'admin' | 'staff' | 'customer';

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  fullName: string;
  isActive?: boolean;
  createdAt?: string;
}

export interface CustomerUser {
  id: string;
  fullName: string;
  email: string;
  role: 'customer';
  createdAt?: string;
}

export type BannerMode = 'image-only' | 'custom';

export interface HeroBanner {
  _id: string;
  mode?: BannerMode; // 'image-only' | 'custom' (defaults to 'custom')
  title: string;
  description?: string;
  badgeText?: string;
  badgeIcon?: string;
  categoryKey?: string;
  ctaText?: string;
  ctaLink?: string;
  imageUrl?: string;
  imagePublicId?: string;
  accentColor?: string;
  backgroundGradient?: string;
  backgroundColor?: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  _id: string;
  sku: string;
  name: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  availableStock: number;
  reorderLevel: number;
  isActive: boolean;
  imageUrl?: string;
  imagePublicId?: string;
  imageSourceUrl?: string;
  imageCredit?: string;
  description?: string;
  unit?: string;
  taxRatePercent?: number;
  createdAt: string;
  updatedAt: string;
}

export type MovementType =
  | 'STOCK_RECEIVED'
  | 'MANUAL_INCREASE'
  | 'MANUAL_DECREASE'
  | 'SALE'
  | 'SALE_RETURN';

export interface InventoryMovement {
  _id: string;
  productId: string;
  productSku: string;
  productName: string;
  type: MovementType;
  quantity: number;
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

export interface SaleItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPurchasePrice: number;
  unitSellingPrice: number;
  lineTotal: number;
  lineProfit: number;
}

export interface Sale {
  _id: string;
  invoiceNumber: string;
  items: SaleItem[];
  subtotal: number;
  discountPercent: number;
  discountAmount: number;
  taxPercent: number;
  taxAmount: number;
  totalAmount: number;
  totalCost: number;
  grossProfit: number;
  status: 'COMPLETED' | 'RETURNED' | 'CANCELLED';
  paymentMethod: 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
  notes?: string;
  userId: string;
  userName: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoreConfig {
  storeName: string;
  storeAddress: string;
  gstin: string;
  currency: string;
  taxRatePercent: number;
  defaultDiscountPercent: number;
}
