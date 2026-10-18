import mongoose, { Schema, Document } from 'mongoose';
import { UserRole, MovementType, SaleStatus } from '../types/index.ts';

// User Schema
export interface IUserDocument extends Document {
  username: string;
  email: string;
  password: string;
  role: UserRole;
  fullName: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export const UserSchema = new Schema<IUserDocument>(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    email: { type: String, required: true, unique: true, trim: true, lowercase: true, index: true },
    password: { type: String, required: true },
    role: { type: String, required: true, enum: ['admin', 'staff', 'customer'], default: 'customer', index: true },
    fullName: { type: String, required: true, trim: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

// Product Schema
export interface IProductDocument extends Document {
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
  createdAt: Date;
  updatedAt: Date;
}

export const ProductSchema = new Schema<IProductDocument>(
  {
    sku: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    name: { type: String, required: true, trim: true, index: true },
    category: { type: String, required: true, trim: true, index: true },
    purchasePrice: { type: Number, required: true, min: 0 },
    sellingPrice: { type: Number, required: true, min: 0 },
    availableStock: { type: Number, required: true, min: 0, default: 0, index: true },
    reorderLevel: { type: Number, required: true, min: 0, default: 10 },
    isActive: { type: Boolean, default: true, index: true },
    imageUrl: { type: String, trim: true },
    imagePublicId: { type: String, trim: true },
    imageSourceUrl: { type: String, trim: true },
    imageCredit: { type: String, trim: true },
    description: { type: String, trim: true },
    unit: { type: String, default: 'pcs', trim: true }
  },
  { timestamps: true }
);

// Inventory Movement Schema
export interface IInventoryMovementDocument extends Document {
  productId: mongoose.Types.ObjectId;
  productSku: string;
  productName: string;
  type: MovementType;
  quantity: number;
  previousStock: number;
  resultingStock: number;
  userId: mongoose.Types.ObjectId;
  userName: string;
  reason: string;
  saleId?: mongoose.Types.ObjectId;
  invoiceNumber?: string;
  timestamp: Date;
  createdAt: Date;
}

export const InventoryMovementSchema = new Schema<IInventoryMovementDocument>(
  {
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    productSku: { type: String, required: true, index: true },
    productName: { type: String, required: true },
    type: {
      type: String,
      required: true,
      enum: ['STOCK_RECEIVED', 'MANUAL_INCREASE', 'MANUAL_DECREASE', 'SALE', 'SALE_RETURN'],
      index: true
    },
    quantity: { type: Number, required: true, min: 1 },
    previousStock: { type: Number, required: true, min: 0 },
    resultingStock: { type: Number, required: true, min: 0 },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true },
    reason: { type: String, required: true, trim: true },
    saleId: { type: Schema.Types.ObjectId, ref: 'Sale', index: true },
    invoiceNumber: { type: String, index: true },
    timestamp: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

// Sale Schema
export interface ISaleDocument extends Document {
  invoiceNumber: string;
  items: Array<{
    productId: mongoose.Types.ObjectId;
    sku: string;
    name: string;
    quantity: number;
    unitPurchasePrice: number;
    unitSellingPrice: number;
    lineTotal: number;
    lineProfit: number;
  }>;
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
  userId: mongoose.Types.ObjectId;
  userName: string;
  createdAt: Date;
  updatedAt: Date;
}

export const SaleSchema = new Schema<ISaleDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true, index: true },
    items: [
      {
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        sku: { type: String, required: true },
        name: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPurchasePrice: { type: Number, required: true, min: 0 },
        unitSellingPrice: { type: Number, required: true, min: 0 },
        lineTotal: { type: Number, required: true, min: 0 },
        lineProfit: { type: Number, required: true }
      }
    ],
    subtotal: { type: Number, required: true, min: 0 },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    taxPercent: { type: Number, default: 18, min: 0 },
    taxAmount: { type: Number, default: 0, min: 0 },
    totalAmount: { type: Number, required: true, min: 0 },
    totalCost: { type: Number, required: true, min: 0 },
    grossProfit: { type: Number, required: true },
    status: { type: String, enum: ['COMPLETED', 'RETURNED', 'CANCELLED'], default: 'COMPLETED', index: true },
    paymentMethod: { type: String, enum: ['CASH', 'CARD', 'UPI', 'CREDIT'], default: 'CASH' },
    notes: { type: String, trim: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    userName: { type: String, required: true }
  },
  { timestamps: true }
);

// Hero Banner Schema
export interface IHeroBannerDocument extends Document {
  mode: string; // 'image-only' | 'custom'
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
  createdAt: Date;
  updatedAt: Date;
}

export const HeroBannerSchema = new Schema<IHeroBannerDocument>(
  {
    mode: { type: String, enum: ['image-only', 'custom'], default: 'custom' },
    title: { type: String, default: 'Promotional Banner', trim: true },
    description: { type: String, default: '', trim: true },
    badgeText: { type: String, default: '', trim: true },
    badgeIcon: { type: String, default: 'Sparkles', trim: true },
    categoryKey: { type: String, default: 'all', trim: true },
    ctaText: { type: String, default: 'Shop Now', trim: true },
    ctaLink: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    imagePublicId: { type: String, trim: true },
    accentColor: { type: String, default: '#a3e635', trim: true },
    backgroundGradient: { type: String, default: 'from-[#032419] via-[#053827] to-[#074732]', trim: true },
    backgroundColor: { type: String, default: '#021811', trim: true },
    sortOrder: { type: Number, default: 0, index: true },
    isActive: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

// Mongoose Models
export const UserModel = mongoose.models.User || mongoose.model<IUserDocument>('User', UserSchema);
export const ProductModel = mongoose.models.Product || mongoose.model<IProductDocument>('Product', ProductSchema);
export const InventoryMovementModel =
  mongoose.models.InventoryMovement ||
  mongoose.model<IInventoryMovementDocument>('InventoryMovement', InventoryMovementSchema);
export const SaleModel = mongoose.models.Sale || mongoose.model<ISaleDocument>('Sale', SaleSchema);
export const HeroBannerModel =
  mongoose.models.HeroBanner || mongoose.model<IHeroBannerDocument>('HeroBanner', HeroBannerSchema);
