import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import {
  IUser,
  IProduct,
  IInventoryMovement,
  ISale,
  IStoreConfig,
  MovementType,
  ISaleItem,
  IHeroBanner
} from '../types/index.ts';

const isVercel = Boolean(process.env.VERCEL);
const DATA_DIR = isVercel
  ? path.resolve('/tmp', 'data')
  : path.resolve(process.cwd(), 'data');
const DB_FILE = path.resolve(DATA_DIR, 'retail_db.json');
const SEED_FILE = path.resolve(process.cwd(), 'data', 'retail_db.json');

export interface DatabaseState {
  users: IUser[];
  products: IProduct[];
  movements: IInventoryMovement[];
  sales: ISale[];
  banners: IHeroBanner[];
  config: IStoreConfig;
  invoiceCounter: number;
}

export const DEFAULT_BANNERS: IHeroBanner[] = [
  {
    _id: 'ban_default_1',
    title: 'Everything You Need, Every Day',
    description:
      'Discover everyday essentials for your home and pantry with instant store pickup, real-time stock availability, and guaranteed authentic inventory.',
    badgeText: 'Curated Daily Retail',
    badgeIcon: 'Sparkles',
    categoryKey: 'all',
    ctaText: 'Shop All Products',
    accentColor: '#a3e635',
    backgroundGradient: 'from-[#032419] via-[#053827] to-[#074732]',
    sortOrder: 1,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'ban_default_2',
    title: 'Upgrade Your Everyday',
    description:
      'Explore dependable tech essentials, high-speed nylon-braided cables, premium audio accessories, and reliable electronics with warranty protection.',
    badgeText: 'Electronics & Tech Accessories',
    badgeIcon: 'Zap',
    categoryKey: 'Electronics & Accessories',
    ctaText: 'Explore Electronics',
    accentColor: '#34d399',
    backgroundGradient: 'from-[#0a1526] via-[#0f2438] to-[#07362a]',
    sortOrder: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'ban_default_3',
    title: 'Your Everyday Pantry, Sorted',
    description:
      'Aged aromatic basmati rice, protein-rich lentils, cold-pressed oils, and farm-fresh spices handpicked for authentic daily family meals.',
    badgeText: 'Pantry & Authentic Kitchen Staples',
    badgeIcon: 'Heart',
    categoryKey: 'Grocery & Staples',
    ctaText: 'Shop Groceries',
    accentColor: '#f59e0b',
    backgroundGradient: 'from-[#1c130b] via-[#2d1e11] to-[#0d3024]',
    sortOrder: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'ban_default_4',
    title: 'A Better Home Starts Here',
    description:
      'Eco-friendly surface cleaners, powerful laundry detergents, bio-enzyme dishwashing solutions, and premium household essentials for a sparkling clean home.',
    badgeText: 'Home Care & Sparkling Spaces',
    badgeIcon: 'ShieldCheck',
    categoryKey: 'Household & Cleaning',
    ctaText: 'Explore Home Essentials',
    accentColor: '#2dd4bf',
    backgroundGradient: 'from-[#032520] via-[#083a32] to-[#04281f]',
    sortOrder: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    _id: 'ban_default_5',
    title: 'Find Your Everyday Favorites',
    description:
      'Browse our complete retail collection of grocery, beverages, snacks, chilled dairy, and home goods with authoritative GST invoicing and click-and-collect.',
    badgeText: 'Apex Retail Mart Verified Catalog',
    badgeIcon: 'ShoppingBag',
    categoryKey: 'all',
    ctaText: 'Explore the Store',
    accentColor: '#a3e635',
    backgroundGradient: 'from-[#032016] via-[#063827] to-[#0a4834]',
    sortOrder: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_CONFIG: IStoreConfig = {
  storeName: process.env.STORE_NAME || 'Apex Retail Mart',
  storeAddress: process.env.STORE_ADDRESS || 'Plot 42, Commercial Avenue, Sector 5',
  gstin: process.env.STORE_GSTIN || '07AAAAA0000A1Z5',
  currency: process.env.DEFAULT_CURRENCY || 'INR',
  taxRatePercent: Number(process.env.DEFAULT_TAX_RATE_PERCENT) || 18,
  defaultDiscountPercent: Number(process.env.DEFAULT_DISCOUNT_PERCENT) || 0
};

class DataStore {
  private state: DatabaseState = {
    users: [],
    products: [],
    movements: [],
    sales: [],
    banners: [],
    config: DEFAULT_CONFIG,
    invoiceCounter: 1000
  };

  private isInitialized = false;
  private transactionLock = false;

  constructor() {
    this.ensureDirectory();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      try {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      } catch (e) {
        console.error('Error creating data directory:', e);
      }
    }
  }

  public async init() {
    if (this.isInitialized) return;
    this.ensureDirectory();

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.state = {
          users: parsed.users || [],
          products: parsed.products || [],
          movements: parsed.movements || [],
          sales: parsed.sales || [],
          banners: parsed.banners && parsed.banners.length > 0 ? parsed.banners : JSON.parse(JSON.stringify(DEFAULT_BANNERS)),
          config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
          invoiceCounter: parsed.invoiceCounter || 1000
        };
      } catch (e) {
        console.warn('Failed to parse existing db file, seeding fresh state:', e);
        await this.seedInitialData();
      }
    } else if (fs.existsSync(SEED_FILE)) {
      try {
        const raw = fs.readFileSync(SEED_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.state = {
          users: parsed.users || [],
          products: parsed.products || [],
          movements: parsed.movements || [],
          sales: parsed.sales || [],
          banners: parsed.banners && parsed.banners.length > 0 ? parsed.banners : JSON.parse(JSON.stringify(DEFAULT_BANNERS)),
          config: { ...DEFAULT_CONFIG, ...(parsed.config || {}) },
          invoiceCounter: parsed.invoiceCounter || 1000
        };
      } catch (e) {
        console.warn('Failed to parse seed file, seeding fresh state:', e);
        await this.seedInitialData();
      }
    } else {
      await this.seedInitialData();
    }

    if (!this.state.banners || this.state.banners.length === 0) {
      this.state.banners = JSON.parse(JSON.stringify(DEFAULT_BANNERS));
    }

    // Ensure at least one admin exists
    const hasAdmin = this.state.users.some((u) => u.role === 'admin' && u.isActive);
    if (!hasAdmin) {
      await this.createFirstAdmin('admin', 'admin@apexretail.local', 'Admin123!', 'System Administrator');
    }

    // Ensure demo customer exists for seamless evaluation
    const hasCustomer = this.state.users.some((u) => u.email === 'customer@example.com' && u.isActive);
    if (!hasCustomer) {
      await this.createCustomer({
        fullName: 'Jane Doe',
        email: 'customer@example.com',
        passwordPlain: 'Customer123!'
      });
    }

    this.isInitialized = true;
    this.persist();
  }

  public async syncFromMongo() {
    try {
      if (mongoose.connection.readyState !== 1 || !mongoose.connection.db) {
        return;
      }
      const mongoDb = mongoose.connection.db;

      // 1. Fetch users from MongoDB Atlas
      const mongoUsers = await mongoDb.collection('users').find({}).toArray();
      if (mongoUsers && mongoUsers.length > 0) {
        this.state.users = mongoUsers.map((u: any) => ({
          _id: u._id.toString(),
          username: u.username,
          email: u.email,
          password: u.password,
          role: u.role,
          fullName: u.fullName || u.name || u.username,
          isActive: u.isActive !== undefined ? u.isActive : true,
          createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : new Date().toISOString()
        }));
      }

      // 2. Fetch products from MongoDB Atlas
      const mongoProducts = await mongoDb.collection('products').find({}).toArray();
      if (mongoProducts && mongoProducts.length > 0) {
        this.state.products = mongoProducts.map((p: any) => ({
          _id: p._id.toString(),
          sku: p.sku,
          name: p.name,
          category: p.category || 'General',
          purchasePrice: Number(p.purchasePrice) || 0,
          sellingPrice: Number(p.sellingPrice) || 0,
          availableStock: p.availableStock !== undefined ? Number(p.availableStock) : 0,
          reorderLevel: p.reorderLevel !== undefined ? Number(p.reorderLevel) : 10,
          isActive: p.isActive !== undefined ? p.isActive : true,
          description: p.description || '',
          unit: p.unit || 'pcs',
          imageUrl: p.imageUrl,
          imagePublicId: p.imagePublicId,
          createdAt: p.createdAt ? new Date(p.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: p.updatedAt ? new Date(p.updatedAt).toISOString() : new Date().toISOString()
        }));
      }

      // 3. Fetch banners from MongoDB Atlas
      const mongoBanners = await mongoDb.collection('banners').find({}).toArray();
      if (mongoBanners && mongoBanners.length > 0) {
        this.state.banners = mongoBanners.map((b: any) => ({
          _id: b._id.toString(),
          title: b.title,
          description: b.description,
          badgeText: b.badgeText,
          badgeIcon: b.badgeIcon,
          categoryKey: b.categoryKey || 'all',
          ctaText: b.ctaText,
          accentColor: b.accentColor,
          backgroundGradient: b.backgroundGradient,
          sortOrder: b.sortOrder !== undefined ? Number(b.sortOrder) : 1,
          isActive: b.isActive !== undefined ? b.isActive : true,
          createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : new Date().toISOString(),
          updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : new Date().toISOString()
        }));
      }

      // 4. Fetch store configs from MongoDB Atlas
      const mongoConfig = await mongoDb.collection('storeconfigs').findOne({});
      if (mongoConfig) {
        this.state.config = {
          storeName: mongoConfig.storeName || this.state.config.storeName,
          storeAddress: mongoConfig.storeAddress || this.state.config.storeAddress,
          gstin: mongoConfig.gstin || this.state.config.gstin,
          currency: mongoConfig.currency || this.state.config.currency,
          taxRatePercent: mongoConfig.taxRatePercent !== undefined ? mongoConfig.taxRatePercent : this.state.config.taxRatePercent,
          defaultDiscountPercent: mongoConfig.defaultDiscountPercent !== undefined ? mongoConfig.defaultDiscountPercent : this.state.config.defaultDiscountPercent
        };
      }

      // Ensure at least one admin exists
      const hasAdmin = this.state.users.some((u) => u.role === 'admin' && u.isActive);
      if (!hasAdmin) {
        await this.createFirstAdmin('admin', 'admin@apexretail.local', 'Admin123!', 'System Administrator');
      }

      console.log(`[MongoSync] Synchronized ${this.state.products.length} products and ${this.state.users.length} users from MongoDB Atlas.`);
    } catch (err: any) {
      console.warn('[MongoSync] Warning syncing data from MongoDB Atlas:', err.message);
    }
  }

  public persist() {
    try {
      this.ensureDirectory();
      const tmpFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tmpFile, JSON.stringify(this.state, null, 2), 'utf-8');
      fs.renameSync(tmpFile, DB_FILE);
    } catch (e) {
      // Harmless on serverless read-only filesystem where persistent state resides in Atlas
      console.warn('Notice: Local filesystem persistence skipped (read-only environment):', (e as any).message);
    }
  }

  public getState(): DatabaseState {
    return this.state;
  }

  public addUserToState(user: IUser) {
    const existingIndex = this.state.users.findIndex(
      (u) => u._id === user._id || u.email.toLowerCase() === user.email.toLowerCase()
    );
    if (existingIndex >= 0) {
      this.state.users[existingIndex] = user;
    } else {
      this.state.users.push(user);
    }
  }

  // --- Configuration ---
  public getConfig(): IStoreConfig {
    return { ...this.state.config };
  }

  public updateConfig(newConfig: Partial<IStoreConfig>): IStoreConfig {
    this.state.config = {
      ...this.state.config,
      ...newConfig
    };
    this.persist();
    return this.getConfig();
  }

  // --- Hero Banner Management ---
  public getBanners(includeInactive = false): IHeroBanner[] {
    const list = this.state.banners || [];
    const filtered = includeInactive ? list : list.filter((b) => b.isActive);
    return [...filtered].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
  }

  public getBannerById(id: string): IHeroBanner | null {
    return (this.state.banners || []).find((b) => b._id === id) || null;
  }

  public createBanner(data: Partial<IHeroBanner>): IHeroBanner {
    const now = new Date().toISOString();
    const existing = this.state.banners || [];
    const maxSort = existing.reduce((max, b) => Math.max(max, b.sortOrder || 0), 0);
    const isImageOnly = data.mode === 'image-only';

    const newBanner: IHeroBanner = {
      _id: 'ban_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      mode: data.mode || 'custom',
      title: (data.title || (isImageOnly ? 'Promotional Banner' : 'Special Promotion')).trim(),
      description: data.description !== undefined ? data.description.trim() : (isImageOnly ? '' : 'Discover fresh deals and quality products'),
      badgeText: data.badgeText !== undefined ? data.badgeText.trim() : (isImageOnly ? '' : 'Featured Promotion'),
      badgeIcon: data.badgeIcon || 'Sparkles',
      categoryKey: data.categoryKey || 'all',
      ctaText: data.ctaText !== undefined ? data.ctaText.trim() : (isImageOnly ? '' : 'Shop Now'),
      ctaLink: data.ctaLink?.trim() || undefined,
      imageUrl: data.imageUrl?.trim() || undefined,
      imagePublicId: data.imagePublicId?.trim() || undefined,
      accentColor: data.accentColor || '#a3e635',
      backgroundGradient: data.backgroundGradient || 'from-[#032419] via-[#053827] to-[#074732]',
      backgroundColor: data.backgroundColor || '#021811',
      sortOrder: data.sortOrder !== undefined ? Number(data.sortOrder) : maxSort + 1,
      isActive: data.isActive !== undefined ? Boolean(data.isActive) : true,
      createdAt: now,
      updatedAt: now
    };

    if (!this.state.banners) {
      this.state.banners = [];
    }
    this.state.banners.push(newBanner);
    this.persist();
    return newBanner;
  }

  public updateBanner(id: string, data: Partial<IHeroBanner>): IHeroBanner {
    const banner = this.getBannerById(id);
    if (!banner) {
      throw new Error(`Banner with ID '${id}' not found`);
    }

    if (data.mode !== undefined) banner.mode = data.mode;
    if (data.title !== undefined) banner.title = data.title.trim();
    if (data.description !== undefined) banner.description = data.description.trim();
    if (data.badgeText !== undefined) banner.badgeText = data.badgeText.trim();
    if (data.badgeIcon !== undefined) banner.badgeIcon = data.badgeIcon.trim();
    if (data.categoryKey !== undefined) banner.categoryKey = data.categoryKey.trim();
    if (data.ctaText !== undefined) banner.ctaText = data.ctaText.trim();
    if (data.ctaLink !== undefined) banner.ctaLink = data.ctaLink?.trim() || undefined;
    if (data.imageUrl !== undefined) banner.imageUrl = data.imageUrl?.trim() || undefined;
    if (data.imagePublicId !== undefined) banner.imagePublicId = data.imagePublicId?.trim() || undefined;
    if (data.accentColor !== undefined) banner.accentColor = data.accentColor.trim();
    if (data.backgroundGradient !== undefined) banner.backgroundGradient = data.backgroundGradient.trim();
    if (data.backgroundColor !== undefined) banner.backgroundColor = data.backgroundColor.trim();
    if (data.sortOrder !== undefined) banner.sortOrder = Number(data.sortOrder);
    if (data.isActive !== undefined) banner.isActive = Boolean(data.isActive);
    banner.updatedAt = new Date().toISOString();

    this.persist();
    return banner;
  }

  public deleteBanner(id: string): boolean {
    const initialLen = (this.state.banners || []).length;
    this.state.banners = (this.state.banners || []).filter((b) => b._id !== id);
    if (this.state.banners.length !== initialLen) {
      this.persist();
      return true;
    }
    return false;
  }

  public setBannerImage(id: string, imageUrl: string, imagePublicId?: string): IHeroBanner {
    const banner = this.getBannerById(id);
    if (!banner) {
      throw new Error(`Banner '${id}' not found`);
    }
    banner.imageUrl = imageUrl;
    banner.imagePublicId = imagePublicId;
    banner.updatedAt = new Date().toISOString();
    this.persist();
    return banner;
  }

  public removeBannerImage(id: string): IHeroBanner {
    const banner = this.getBannerById(id);
    if (!banner) {
      throw new Error(`Banner '${id}' not found`);
    }
    banner.imageUrl = undefined;
    banner.imagePublicId = undefined;
    banner.updatedAt = new Date().toISOString();
    this.persist();
    return banner;
  }

  public reorderBanners(orderedIds: string[]): IHeroBanner[] {
    if (!this.state.banners) this.state.banners = [];
    const bannerMap = new Map(this.state.banners.map((b) => [b._id, b]));

    orderedIds.forEach((id, index) => {
      const banner = bannerMap.get(id);
      if (banner) {
        banner.sortOrder = index + 1;
        banner.updatedAt = new Date().toISOString();
      }
    });

    this.persist();
    return this.getBanners(true);
  }

  public resetDefaultBanners(): IHeroBanner[] {
    const now = new Date().toISOString();
    this.state.banners = JSON.parse(JSON.stringify(DEFAULT_BANNERS)).map((b: IHeroBanner) => ({
      ...b,
      createdAt: now,
      updatedAt: now
    }));
    this.persist();
    return this.getBanners(true);
  }

  // --- User Management ---
  public async createFirstAdmin(
    username: string,
    email: string,
    passwordPlain: string,
    fullName: string
  ): Promise<IUser> {
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(passwordPlain, salt);
    const now = new Date().toISOString();

    const existing = this.state.users.find(
      (u) => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === email.toLowerCase()
    );

    if (existing) {
      existing.password = hashedPassword;
      existing.role = 'admin';
      existing.isActive = true;
      existing.updatedAt = now;
      this.persist();
      return existing;
    }

    const adminUser: IUser = {
      _id: 'usr_' + Date.now() + '_adm',
      username: username.toLowerCase().trim(),
      email: email.toLowerCase().trim(),
      password: hashedPassword,
      role: 'admin',
      fullName,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    this.state.users.push(adminUser);
    this.persist();
    return adminUser;
  }

  public async createUser(userData: {
    username: string;
    email: string;
    passwordPlain: string;
    role: 'admin' | 'staff';
    fullName: string;
  }): Promise<IUser> {
    const cleanUsername = userData.username.toLowerCase().trim();
    const cleanEmail = userData.email.toLowerCase().trim();

    const usernameExists = this.state.users.some((u) => u.username.toLowerCase() === cleanUsername);
    if (usernameExists) {
      throw new Error(`Username '${cleanUsername}' is already taken.`);
    }

    const emailExists = this.state.users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      throw new Error(`Email '${cleanEmail}' is already registered.`);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(userData.passwordPlain, salt);
    const now = new Date().toISOString();

    const newUser: IUser = {
      _id: 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: cleanUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: userData.role,
      fullName: userData.fullName.trim(),
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    this.state.users.push(newUser);
    this.persist();

    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        await mongoose.connection.db.collection('users').insertOne({
          ...newUser,
          _id: newUser._id
        });
        console.log(`[MongoAtlas] Persisted new user '${newUser.username}' to MongoDB Atlas.`);
      } catch (err: any) {
        console.warn(`[MongoAtlas] Error inserting user into MongoDB: ${err.message}`);
      }
    }

    return newUser;
  }

  public async createCustomer(customerData: {
    fullName: string;
    email: string;
    passwordPlain: string;
  }): Promise<IUser> {
    const cleanEmail = customerData.email.toLowerCase().trim();
    const cleanFullName = customerData.fullName.trim();
    const generatedUsername = cleanEmail.split('@')[0] + '_' + Math.random().toString(36).substring(2, 6);

    const emailExists = this.state.users.some((u) => u.email.toLowerCase() === cleanEmail);
    if (emailExists) {
      throw new Error(`An account with email '${cleanEmail}' already exists.`);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(customerData.passwordPlain, salt);
    const now = new Date().toISOString();

    const newCustomer: IUser = {
      _id: 'cust_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      username: generatedUsername,
      email: cleanEmail,
      password: hashedPassword,
      role: 'customer',
      fullName: cleanFullName,
      isActive: true,
      createdAt: now,
      updatedAt: now
    };

    this.state.users.push(newCustomer);
    this.persist();

    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      try {
        await mongoose.connection.db.collection('users').insertOne({
          ...newCustomer,
          _id: newCustomer._id
        });
        console.log(`[MongoAtlas] Persisted new customer '${cleanEmail}' to MongoDB Atlas.`);
      } catch (err: any) {
        console.warn(`[MongoAtlas] Error inserting customer into MongoDB: ${err.message}`);
      }
    }

    return newCustomer;
  }

  public getCustomerOrders(customerId: string, customerEmail?: string): ISale[] {
    const cleanEmail = customerEmail ? customerEmail.toLowerCase().trim() : null;
    return this.state.sales
      .filter((s) => {
        if (s.userId === customerId) return true;
        if (cleanEmail && s.notes && s.notes.toLowerCase().includes(cleanEmail)) return true;
        return false;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public findUserById(id: string): IUser | undefined {
    return this.state.users.find((u) => u._id === id);
  }

  public findUserByUsernameOrEmail(identifier: string): IUser | undefined {
    if (!identifier) return undefined;
    const clean = identifier.toLowerCase().trim();
    return this.state.users.find(
      (u) =>
        (u.username && u.username.toLowerCase() === clean) ||
        (u.email && u.email.toLowerCase() === clean)
    );
  }

  public getAllUsers(): Omit<IUser, 'password'>[] {
    return this.state.users.map(({ password, ...rest }) => rest);
  }

  public updateUserRole(userId: string, role: 'admin' | 'staff', isActive: boolean): IUser {
    const user = this.state.users.find((u) => u._id === userId);
    if (!user) throw new Error('User not found');
    user.role = role;
    user.isActive = isActive;
    user.updatedAt = new Date().toISOString();
    this.persist();
    return user;
  }

  // --- Product Management ---
  public getProducts(options?: {
    search?: string;
    category?: string;
    excludeCategories?: string[];
    stockStatus?: 'in_stock' | 'low_stock' | 'out_of_stock';
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'name' | 'sku' | 'availableStock' | 'sellingPrice' | 'createdAt';
    sortOrder?: 'asc' | 'desc';
  }) {
    let result = [...this.state.products];

    // Filter by active
    if (options?.isActive !== undefined) {
      result = result.filter((p) => p.isActive === options.isActive);
    }

    if (options?.excludeCategories?.length) {
      const excludedCategories = new Set(options.excludeCategories.map((category) => category.toLowerCase()));
      result = result.filter((p) => !excludedCategories.has(p.category.toLowerCase()));
    }

    // Category filter
    if (options?.category && options.category !== 'all') {
      result = result.filter((p) => p.category.toLowerCase() === options.category!.toLowerCase());
    }

    // Stock status filter
    if (options?.stockStatus) {
      if (options.stockStatus === 'out_of_stock') {
        result = result.filter((p) => p.availableStock === 0);
      } else if (options.stockStatus === 'low_stock') {
        result = result.filter((p) => p.availableStock > 0 && p.availableStock <= p.reorderLevel);
      } else if (options.stockStatus === 'in_stock') {
        result = result.filter((p) => p.availableStock > p.reorderLevel);
      }
    }

    // Search by name or SKU
    if (options?.search && options.search.trim() !== '') {
      const q = options.search.toLowerCase().trim();
      result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
    }

    // Sorting
    const sortBy = options?.sortBy || 'createdAt';
    const sortOrder = options?.sortOrder || 'desc';

    result.sort((a, b) => {
      let valA = a[sortBy] ?? '';
      let valB = b[sortBy] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
      if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    const total = result.length;
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      products: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public getProductById(id: string): IProduct | undefined {
    return this.state.products.find((p) => p._id === id);
  }

  public getProductBySku(sku: string): IProduct | undefined {
    const cleanSku = sku.toUpperCase().trim();
    return this.state.products.find((p) => p.sku === cleanSku);
  }

  public createProduct(
    productData: {
      sku: string;
      name: string;
      category: string;
      purchasePrice: number;
      sellingPrice: number;
      availableStock?: number;
      reorderLevel?: number;
      description?: string;
      unit?: string;
      imageUrl?: string;
      imagePublicId?: string;
    },
    user: { id: string; name: string }
  ): IProduct {
    const cleanSku = productData.sku.toUpperCase().trim();

    if (!cleanSku) throw new Error('SKU is required.');
    if (!productData.name || productData.name.trim() === '') throw new Error('Product name is required.');
    if (productData.purchasePrice < 0) throw new Error('Purchase price cannot be negative.');
    if (productData.sellingPrice < 0) throw new Error('Selling price cannot be negative.');

    const existing = this.getProductBySku(cleanSku);
    if (existing) {
      throw new Error(`Product with SKU '${cleanSku}' already exists.`);
    }

    const now = new Date().toISOString();
    const initialStock = Number(productData.availableStock) || 0;

    const newProduct: IProduct = {
      _id: 'prd_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      sku: cleanSku,
      name: productData.name.trim(),
      category: productData.category.trim() || 'General',
      purchasePrice: Number(productData.purchasePrice),
      sellingPrice: Number(productData.sellingPrice),
      availableStock: initialStock,
      reorderLevel: Number(productData.reorderLevel) || 10,
      isActive: true,
      imageUrl: productData.imageUrl,
      imagePublicId: productData.imagePublicId,
      description: productData.description?.trim(),
      unit: productData.unit?.trim() || 'pcs',
      createdAt: now,
      updatedAt: now
    };

    this.state.products.push(newProduct);

    // If initial stock was provided > 0, log an initial stock movement
    if (initialStock > 0) {
      this.recordMovement({
        productId: newProduct._id,
        productSku: newProduct.sku,
        productName: newProduct.name,
        type: 'STOCK_RECEIVED',
        quantity: initialStock,
        previousStock: 0,
        resultingStock: initialStock,
        userId: user.id,
        userName: user.name,
        reason: 'Initial stock on product creation'
      });
    }

    this.persist();
    return newProduct;
  }

  public updateProduct(
    id: string,
    updates: {
      name?: string;
      category?: string;
      purchasePrice?: number;
      sellingPrice?: number;
      reorderLevel?: number;
      description?: string;
      unit?: string;
      sku?: string;
      imageUrl?: string;
      imagePublicId?: string;
    }
  ): IProduct {
    const product = this.getProductById(id);
    if (!product) throw new Error('Product not found.');

    if (updates.sku) {
      const cleanSku = updates.sku.toUpperCase().trim();
      if (cleanSku !== product.sku) {
        const existing = this.getProductBySku(cleanSku);
        if (existing) throw new Error(`SKU '${cleanSku}' already in use.`);
        product.sku = cleanSku;
      }
    }

    if (updates.name !== undefined) product.name = updates.name.trim();
    if (updates.category !== undefined) product.category = updates.category.trim();
    if (updates.purchasePrice !== undefined) {
      if (updates.purchasePrice < 0) throw new Error('Purchase price cannot be negative.');
      product.purchasePrice = Number(updates.purchasePrice);
    }
    if (updates.sellingPrice !== undefined) {
      if (updates.sellingPrice < 0) throw new Error('Selling price cannot be negative.');
      product.sellingPrice = Number(updates.sellingPrice);
    }
    if (updates.reorderLevel !== undefined) {
      if (updates.reorderLevel < 0) throw new Error('Reorder level cannot be negative.');
      product.reorderLevel = Number(updates.reorderLevel);
    }
    if (updates.description !== undefined) product.description = updates.description.trim();
    if (updates.unit !== undefined) product.unit = updates.unit.trim();
    if (updates.imageUrl !== undefined) product.imageUrl = updates.imageUrl;
    if (updates.imagePublicId !== undefined) product.imagePublicId = updates.imagePublicId;

    product.updatedAt = new Date().toISOString();
    this.persist();
    return product;
  }

  public setProductImage(id: string, imageUrl: string, imagePublicId: string): IProduct {
    const product = this.getProductById(id);
    if (!product) throw new Error('Product not found.');
    product.imageUrl = imageUrl;
    product.imagePublicId = imagePublicId;
    product.updatedAt = new Date().toISOString();
    this.persist();

    // Persist to MongoDB Atlas
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const filterConditions: any[] = [{ _id: id }, { sku: product.sku }];
      if (mongoose.Types.ObjectId.isValid(id)) {
        filterConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      mongoose.connection.db
        .collection('products')
        .updateOne(
          { $or: filterConditions },
          { $set: { imageUrl, imagePublicId, updatedAt: product.updatedAt } }
        )
        .catch((err) => console.warn(`[MongoAtlas] Failed to persist product image for ${id}:`, err.message));
    }

    return product;
  }

  public removeProductImage(id: string): IProduct {
    const product = this.getProductById(id);
    if (!product) throw new Error('Product not found.');
    delete product.imageUrl;
    delete product.imagePublicId;
    product.updatedAt = new Date().toISOString();
    this.persist();

    // Persist to MongoDB Atlas
    if (mongoose.connection.readyState === 1 && mongoose.connection.db) {
      const filterConditions: any[] = [{ _id: id }, { sku: product.sku }];
      if (mongoose.Types.ObjectId.isValid(id)) {
        filterConditions.push({ _id: new mongoose.Types.ObjectId(id) });
      }
      mongoose.connection.db
        .collection('products')
        .updateOne(
          { $or: filterConditions },
          { $unset: { imageUrl: '', imagePublicId: '' }, $set: { updatedAt: product.updatedAt } }
        )
        .catch((err) => console.warn(`[MongoAtlas] Failed to remove product image for ${id}:`, err.message));
    }

    return product;
  }

  public setProductStatus(id: string, isActive: boolean): IProduct {
    const product = this.getProductById(id);
    if (!product) throw new Error('Product not found.');
    product.isActive = isActive;
    product.updatedAt = new Date().toISOString();
    this.persist();
    return product;
  }

  public getCategories(): string[] {
    const set = new Set<string>();
    this.state.products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set).sort();
  }

  // --- Inventory Adjustments & Audit Trail ---
  public recordMovement(movementData: {
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
  }): IInventoryMovement {
    const now = new Date().toISOString();
    const movement: IInventoryMovement = {
      _id: 'mvt_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
      productId: movementData.productId,
      productSku: movementData.productSku,
      productName: movementData.productName,
      type: movementData.type,
      quantity: Math.abs(movementData.quantity),
      previousStock: movementData.previousStock,
      resultingStock: movementData.resultingStock,
      userId: movementData.userId,
      userName: movementData.userName,
      reason: movementData.reason,
      saleId: movementData.saleId,
      invoiceNumber: movementData.invoiceNumber,
      timestamp: now,
      createdAt: now
    };

    this.state.movements.unshift(movement);
    return movement;
  }

  public adjustInventory(params: {
    productId: string;
    adjustmentType: 'STOCK_RECEIVED' | 'MANUAL_INCREASE' | 'MANUAL_DECREASE';
    quantity: number;
    reason: string;
    user: { id: string; name: string };
  }): { product: IProduct; movement: IInventoryMovement } {
    const product = this.getProductById(params.productId);
    if (!product) throw new Error('Product not found.');

    const qty = Number(params.quantity);
    if (!qty || qty <= 0 || !Number.isInteger(qty)) {
      throw new Error('Quantity must be a positive integer.');
    }
    if (!params.reason || params.reason.trim() === '') {
      throw new Error('Adjustment reason is required for audit trail.');
    }

    const previousStock = product.availableStock;
    let resultingStock = previousStock;

    if (params.adjustmentType === 'STOCK_RECEIVED' || params.adjustmentType === 'MANUAL_INCREASE') {
      resultingStock = previousStock + qty;
    } else if (params.adjustmentType === 'MANUAL_DECREASE') {
      if (previousStock < qty) {
        throw new Error(
          `Cannot decrease stock by ${qty}. Current available stock is ${previousStock}. Negative stock is prevented.`
        );
      }
      resultingStock = previousStock - qty;
    } else {
      throw new Error(`Unsupported adjustment type: ${params.adjustmentType}`);
    }

    product.availableStock = resultingStock;
    product.updatedAt = new Date().toISOString();

    const movement = this.recordMovement({
      productId: product._id,
      productSku: product.sku,
      productName: product.name,
      type: params.adjustmentType,
      quantity: qty,
      previousStock,
      resultingStock,
      userId: params.user.id,
      userName: params.user.name,
      reason: params.reason.trim()
    });

    this.persist();
    return { product, movement };
  }

  public getMovements(options?: {
    productId?: string;
    type?: MovementType;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) {
    let result = [...this.state.movements];

    if (options?.productId) {
      result = result.filter((m) => m.productId === options.productId);
    }

    if (options?.type) {
      result = result.filter((m) => m.type === options.type);
    }

    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      result = result.filter((m) => new Date(m.timestamp).getTime() >= start);
    }

    if (options?.endDate) {
      // Include the entire end date up to 23:59:59.999
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();
      result = result.filter((m) => new Date(m.timestamp).getTime() <= endTime);
    }

    const total = result.length;
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      movements: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public getLowStockProducts() {
    return this.state.products.filter((p) => p.isActive && p.availableStock <= p.reorderLevel);
  }

  // --- Sales & Invoice Management (Atomic Authoritative Backend) ---
  public async createSale(saleRequest: {
    items: Array<{ productId: string; quantity: number }>;
    discountPercent?: number;
    paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
    notes?: string;
    user: { id: string; name: string };
  }): Promise<ISale> {
    // Acquire concurrency lock to guarantee atomic stock check & deduction
    while (this.transactionLock) {
      await new Promise((r) => setTimeout(r, 10));
    }
    this.transactionLock = true;

    try {
      if (!saleRequest.items || !Array.isArray(saleRequest.items) || saleRequest.items.length === 0) {
        throw new Error('Sale must contain at least one product item.');
      }

      // Check for duplicate product IDs in the request payload
      const seenIds = new Set<string>();
      for (const item of saleRequest.items) {
        if (!item.productId) throw new Error('Each item must have a valid productId.');
        if (seenIds.has(item.productId)) {
          throw new Error('Duplicate product entries found in sale request. Please combine quantities.');
        }
        seenIds.add(item.productId);
      }

      // Pre-validation: Fetch and verify every product
      const validatedItems: Array<{
        product: IProduct;
        quantity: number;
      }> = [];

      for (const item of saleRequest.items) {
        const qty = Number(item.quantity);
        if (!qty || qty <= 0 || !Number.isInteger(qty)) {
          throw new Error(`Invalid quantity ${item.quantity} for item. Quantity must be a positive integer.`);
        }

        const product = this.getProductById(item.productId);
        if (!product) {
          throw new Error(`Product with ID '${item.productId}' not found in catalog.`);
        }

        if (!product.isActive) {
          throw new Error(`Product '${product.name}' (${product.sku}) is currently deactivated and cannot be sold.`);
        }

        if (product.availableStock < qty) {
          throw new Error(
            `Insufficient stock for '${product.name}' (${product.sku}). Available: ${product.availableStock}, Requested: ${qty}. Sale aborted.`
          );
        }

        validatedItems.push({ product, quantity: qty });
      }

      // Authoritative backend pricing calculation (Decimal-safe arithmetic in cents/minor units)
      let subtotalCents = 0;
      let totalCostCents = 0;
      const saleItems: ISaleItem[] = [];

      for (const { product, quantity } of validatedItems) {
        const unitSellingCents = Math.round(product.sellingPrice * 100);
        const unitCostCents = Math.round(product.purchasePrice * 100);
        const lineTotalCents = unitSellingCents * quantity;
        const lineCostCents = unitCostCents * quantity;
        const lineProfitCents = lineTotalCents - lineCostCents;

        subtotalCents += lineTotalCents;
        totalCostCents += lineCostCents;

        saleItems.push({
          productId: product._id,
          sku: product.sku,
          name: product.name,
          quantity,
          unitPurchasePrice: product.purchasePrice,
          unitSellingPrice: product.sellingPrice,
          lineTotal: Number((lineTotalCents / 100).toFixed(2)),
          lineProfit: Number((lineProfitCents / 100).toFixed(2))
        });
      }

      // Discount calculation
      let discountPercent = Number(saleRequest.discountPercent);
      if (isNaN(discountPercent) || discountPercent < 0) {
        discountPercent = this.state.config.defaultDiscountPercent || 0;
      }
      if (discountPercent > 100) discountPercent = 100;

      const discountAmountCents = Math.round((subtotalCents * discountPercent) / 100);
      const afterDiscountCents = Math.max(0, subtotalCents - discountAmountCents);

      // Tax calculation (e.g. 18% GST on net amount)
      const taxPercent = this.state.config.taxRatePercent || 18;
      const taxAmountCents = Math.round((afterDiscountCents * taxPercent) / 100);
      const totalAmountCents = afterDiscountCents + taxAmountCents;

      // Gross profit = Total revenue (ex-tax) minus Total purchase cost
      const grossProfitCents = afterDiscountCents - totalCostCents;

      // Unique sequential invoice number generation with collision prevention
      this.state.invoiceCounter += 1;
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      let invoiceNumber = `INV-${dateStr}-${String(this.state.invoiceCounter).padStart(5, '0')}`;

      // Ensure uniqueness against collision
      while (this.state.sales.some((s) => s.invoiceNumber === invoiceNumber)) {
        this.state.invoiceCounter += 1;
        invoiceNumber = `INV-${dateStr}-${String(this.state.invoiceCounter).padStart(5, '0')}`;
      }

      const saleId = 'sal_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
      const now = new Date().toISOString();

      // ATOMIC STEP: Deduct inventory and record movements
      const movementsCreated: IInventoryMovement[] = [];

      for (const { product, quantity } of validatedItems) {
        const prevStock = product.availableStock;
        const newStock = prevStock - quantity;

        product.availableStock = newStock;
        product.updatedAt = now;

        const mvt = this.recordMovement({
          productId: product._id,
          productSku: product.sku,
          productName: product.name,
          type: 'SALE',
          quantity,
          previousStock: prevStock,
          resultingStock: newStock,
          userId: saleRequest.user.id,
          userName: saleRequest.user.name,
          reason: `Sale order completed (Invoice: ${invoiceNumber})`,
          saleId,
          invoiceNumber
        });
        movementsCreated.push(mvt);
      }

      const newSale: ISale = {
        _id: saleId,
        invoiceNumber,
        items: saleItems,
        subtotal: Number((subtotalCents / 100).toFixed(2)),
        discountPercent,
        discountAmount: Number((discountAmountCents / 100).toFixed(2)),
        taxPercent,
        taxAmount: Number((taxAmountCents / 100).toFixed(2)),
        totalAmount: Number((totalAmountCents / 100).toFixed(2)),
        totalCost: Number((totalCostCents / 100).toFixed(2)),
        grossProfit: Number((grossProfitCents / 100).toFixed(2)),
        status: 'COMPLETED',
        paymentMethod: saleRequest.paymentMethod || 'CASH',
        notes: saleRequest.notes?.trim(),
        userId: saleRequest.user.id,
        userName: saleRequest.user.name,
        createdAt: now,
        updatedAt: now
      };

      this.state.sales.unshift(newSale);
      this.persist();

      return newSale;
    } finally {
      this.transactionLock = false;
    }
  }

  public getSales(options?: {
    search?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) {
    let result = [...this.state.sales];

    if (options?.search && options.search.trim() !== '') {
      const q = options.search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.invoiceNumber.toLowerCase().includes(q) ||
          s.userName.toLowerCase().includes(q) ||
          s.items.some((it) => it.name.toLowerCase().includes(q) || it.sku.toLowerCase().includes(q))
      );
    }

    if (options?.status && options.status !== 'all') {
      result = result.filter((s) => s.status === options.status);
    }

    if (options?.startDate) {
      const start = new Date(options.startDate).getTime();
      result = result.filter((s) => new Date(s.createdAt).getTime() >= start);
    }

    if (options?.endDate) {
      const end = new Date(options.endDate);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();
      result = result.filter((s) => new Date(s.createdAt).getTime() <= endTime);
    }

    const total = result.length;
    const page = options?.page && options.page > 0 ? options.page : 1;
    const limit = options?.limit && options.limit > 0 ? options.limit : 50;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      sales: paginated,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    };
  }

  public getSaleById(id: string): ISale | undefined {
    return this.state.sales.find((s) => s._id === id || s.invoiceNumber === id);
  }

  // Bonus feature: Sales Return / Refund workflow
  public returnSale(
    saleId: string,
    reason: string,
    user: { id: string; name: string }
  ): { sale: ISale; returnedMovements: IInventoryMovement[] } {
    const sale = this.getSaleById(saleId);
    if (!sale) throw new Error('Sale not found.');
    if (sale.status === 'RETURNED') throw new Error('Sale has already been returned.');

    const now = new Date().toISOString();
    const returnedMovements: IInventoryMovement[] = [];

    // Restore stock and record SALE_RETURN movements
    for (const item of sale.items) {
      const product = this.getProductById(item.productId);
      if (product) {
        const prevStock = product.availableStock;
        const newStock = prevStock + item.quantity;
        product.availableStock = newStock;
        product.updatedAt = now;

        const mvt = this.recordMovement({
          productId: product._id,
          productSku: product.sku,
          productName: product.name,
          type: 'SALE_RETURN',
          quantity: item.quantity,
          previousStock: prevStock,
          resultingStock: newStock,
          userId: user.id,
          userName: user.name,
          reason: `Sales return for invoice ${sale.invoiceNumber}: ${reason}`,
          saleId: sale._id,
          invoiceNumber: sale.invoiceNumber
        });
        returnedMovements.push(mvt);
      }
    }

    sale.status = 'RETURNED';
    sale.updatedAt = now;
    this.persist();

    return { sale, returnedMovements };
  }

  // --- Reports & Analytics ---
  public getSalesReport(startDate?: string, endDate?: string) {
    let sales = [...this.state.sales];

    if (startDate) {
      const start = new Date(startDate).getTime();
      sales = sales.filter((s) => new Date(s.createdAt).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();
      sales = sales.filter((s) => new Date(s.createdAt).getTime() <= endTime);
    }

    // Only count completed sales in revenue/profit calculations
    const completedSales = sales.filter((s) => s.status === 'COMPLETED');
    const returnedSales = sales.filter((s) => s.status === 'RETURNED');

    const totalSalesAmount = completedSales.reduce((acc, s) => acc + s.totalAmount, 0);
    const totalSubtotal = completedSales.reduce((acc, s) => acc + s.subtotal, 0);
    const totalDiscount = completedSales.reduce((acc, s) => acc + s.discountAmount, 0);
    const totalTax = completedSales.reduce((acc, s) => acc + s.taxAmount, 0);
    const totalTransactions = completedSales.length;

    // Top-selling products
    const productStatsMap = new Map<
      string,
      { productId: string; sku: string; name: string; quantitySold: number; totalRevenue: number }
    >();

    for (const sale of completedSales) {
      for (const item of sale.items) {
        const existing = productStatsMap.get(item.productId) || {
          productId: item.productId,
          sku: item.sku,
          name: item.name,
          quantitySold: 0,
          totalRevenue: 0
        };
        existing.quantitySold += item.quantity;
        existing.totalRevenue += item.lineTotal;
        productStatsMap.set(item.productId, existing);
      }
    }

    const topProducts = Array.from(productStatsMap.values())
      .sort((a, b) => b.quantitySold - a.quantitySold)
      .slice(0, 5);

    // Sales timeline by day
    const timelineMap = new Map<string, { date: string; sales: number; count: number }>();
    for (const sale of completedSales) {
      const dateKey = sale.createdAt.slice(0, 10);
      const cur = timelineMap.get(dateKey) || { date: dateKey, sales: 0, count: 0 };
      cur.sales = Number((cur.sales + sale.totalAmount).toFixed(2));
      cur.count += 1;
      timelineMap.set(dateKey, cur);
    }
    const timeline = Array.from(timelineMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    return {
      period: {
        startDate: startDate || (sales.length > 0 ? sales[sales.length - 1].createdAt.slice(0, 10) : 'all'),
        endDate: endDate || new Date().toISOString().slice(0, 10)
      },
      summary: {
        totalSalesAmount: Number(totalSalesAmount.toFixed(2)),
        totalSubtotal: Number(totalSubtotal.toFixed(2)),
        totalDiscount: Number(totalDiscount.toFixed(2)),
        totalTax: Number(totalTax.toFixed(2)),
        totalTransactions,
        returnedTransactions: returnedSales.length,
        averageOrderValue: totalTransactions > 0 ? Number((totalSalesAmount / totalTransactions).toFixed(2)) : 0
      },
      topSellingProducts: topProducts,
      salesTimeline: timeline
    };
  }

  public getProfitReport(startDate?: string, endDate?: string) {
    let sales = [...this.state.sales];

    if (startDate) {
      const start = new Date(startDate).getTime();
      sales = sales.filter((s) => new Date(s.createdAt).getTime() >= start);
    }

    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      const endTime = end.getTime();
      sales = sales.filter((s) => new Date(s.createdAt).getTime() <= endTime);
    }

    const completedSales = sales.filter((s) => s.status === 'COMPLETED');

    const totalRevenue = completedSales.reduce((acc, s) => acc + s.totalAmount, 0);
    // Net revenue excluding taxes
    const totalNetRevenue = completedSales.reduce((acc, s) => acc + (s.subtotal - s.discountAmount), 0);
    const totalCost = completedSales.reduce((acc, s) => acc + s.totalCost, 0);
    const totalGrossProfit = completedSales.reduce((acc, s) => acc + s.grossProfit, 0);
    const profitMarginPercent = totalNetRevenue > 0 ? (totalGrossProfit / totalNetRevenue) * 100 : 0;

    // Profit by product category
    const categoryProfitMap = new Map<
      string,
      { category: string; revenue: number; cost: number; profit: number; unitsSold: number }
    >();

    for (const sale of completedSales) {
      for (const item of sale.items) {
        const product = this.getProductById(item.productId);
        const category = product?.category || 'General';
        const cur = categoryProfitMap.get(category) || {
          category,
          revenue: 0,
          cost: 0,
          profit: 0,
          unitsSold: 0
        };

        const itemCost = item.unitPurchasePrice * item.quantity;
        cur.revenue += item.lineTotal;
        cur.cost += itemCost;
        cur.profit += item.lineTotal - itemCost;
        cur.unitsSold += item.quantity;
        categoryProfitMap.set(category, cur);
      }
    }

    const categoryBreakdown = Array.from(categoryProfitMap.values()).map((c) => ({
      ...c,
      revenue: Number(c.revenue.toFixed(2)),
      cost: Number(c.cost.toFixed(2)),
      profit: Number(c.profit.toFixed(2)),
      marginPercent: c.revenue > 0 ? Number(((c.profit / c.revenue) * 100).toFixed(1)) : 0
    }));

    return {
      period: {
        startDate: startDate || (sales.length > 0 ? sales[sales.length - 1].createdAt.slice(0, 10) : 'all'),
        endDate: endDate || new Date().toISOString().slice(0, 10)
      },
      metrics: {
        totalRevenue: Number(totalRevenue.toFixed(2)),
        totalNetRevenue: Number(totalNetRevenue.toFixed(2)),
        totalCost: Number(totalCost.toFixed(2)),
        grossProfit: Number(totalGrossProfit.toFixed(2)),
        grossMarginPercent: Number(profitMarginPercent.toFixed(1)),
        transactionsAnalyzed: completedSales.length
      },
      categoryBreakdown
    };
  }

  // Initial demo seed data
  private async seedInitialData() {
    console.log('Seeding initial retail catalog and users...');
    const now = new Date();
    const isoNow = now.toISOString();

    // 1. Users: Admin and Staff
    const salt = await bcrypt.genSalt(10);
    const adminPass = await bcrypt.hash('Admin123!', salt);
    const staffPass = await bcrypt.hash('Staff123!', salt);

    const adminUser: IUser = {
      _id: 'usr_admin_default',
      username: 'admin',
      email: 'admin@apexretail.local',
      password: adminPass,
      role: 'admin',
      fullName: 'Vikram Sharma (Store Manager)',
      isActive: true,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    const staffUser: IUser = {
      _id: 'usr_staff_default',
      username: 'staff',
      email: 'staff@apexretail.local',
      password: staffPass,
      role: 'staff',
      fullName: 'Priya Patel (Cashier)',
      isActive: true,
      createdAt: isoNow,
      updatedAt: isoNow
    };

    this.state.users = [adminUser, staffUser];

    // 2. Sample Products across Grocery, Beverages, Electronics, Household
    const initialProducts: Array<Omit<IProduct, '_id' | 'createdAt' | 'updatedAt'>> = [
      {
        sku: 'GROC-BAS-001',
        name: 'Organic Basmati Rice (5kg)',
        category: 'Grocery & Staples',
        purchasePrice: 380,
        sellingPrice: 520,
        availableStock: 45,
        reorderLevel: 15,
        isActive: true,
        description: 'Premium aged extra-long grain aromatic basmati rice.',
        unit: 'bag'
      },
      {
        sku: 'GROC-DAL-002',
        name: 'Toor Dal Premium (1kg)',
        category: 'Grocery & Staples',
        purchasePrice: 110,
        sellingPrice: 155,
        availableStock: 30,
        reorderLevel: 12,
        isActive: true,
        description: 'Unpolished protein-rich farm fresh toor lentils.',
        unit: 'pouch'
      },
      {
        sku: 'BEV-TEA-003',
        name: 'Assam Gold Black Tea (500g)',
        category: 'Beverages',
        purchasePrice: 220,
        sellingPrice: 310,
        availableStock: 8, // Low stock demo!
        reorderLevel: 10,
        isActive: true,
        description: 'Strong full-bodied CTC tea leaves from Assam estate.',
        unit: 'box'
      },
      {
        sku: 'BEV-COF-004',
        name: 'Dark Roast Arabica Coffee (250g)',
        category: 'Beverages',
        purchasePrice: 290,
        sellingPrice: 420,
        availableStock: 25,
        reorderLevel: 8,
        isActive: true,
        description: 'Single-origin estate ground arabica coffee beans.',
        unit: 'tin'
      },
      {
        sku: 'ELEC-CBL-005',
        name: 'Braided USB-C Fast Charging Cable (2m)',
        category: 'Electronics & Accessories',
        purchasePrice: 140,
        sellingPrice: 349,
        availableStock: 3, // Low stock demo!
        reorderLevel: 10,
        isActive: true,
        description: '60W PD high-durability tangle-free nylon cord.',
        unit: 'pcs'
      },
      {
        sku: 'ELEC-BNK-006',
        name: 'Slim PowerBank 10000mAh',
        category: 'Electronics & Accessories',
        purchasePrice: 650,
        sellingPrice: 1199,
        availableStock: 0, // Out of stock demo!
        reorderLevel: 5,
        isActive: true,
        description: 'Dual port 22.5W quick charge pocket external battery.',
        unit: 'pcs'
      },
      {
        sku: 'ELEC-EAR-007',
        name: 'True Wireless Earbuds ANC',
        category: 'Electronics & Accessories',
        purchasePrice: 1200,
        sellingPrice: 2299,
        availableStock: 18,
        reorderLevel: 6,
        isActive: true,
        description: 'Active noise cancellation Bluetooth 5.3 earbuds.',
        unit: 'box'
      },
      {
        sku: 'DAIR-MIL-008',
        name: 'Full Cream Farm Fresh Milk (1L)',
        category: 'Dairy & Chilled',
        purchasePrice: 52,
        sellingPrice: 68,
        availableStock: 50,
        reorderLevel: 20,
        isActive: true,
        description: 'Homogenized pasteurized rich farm milk.',
        unit: 'tetra'
      },
      {
        sku: 'SNK-ALM-009',
        name: 'California Roasted Almonds (500g)',
        category: 'Snacks & Dry Fruits',
        purchasePrice: 360,
        sellingPrice: 499,
        availableStock: 22,
        reorderLevel: 10,
        isActive: true,
        description: 'Lightly salted oven-roasted premium almonds.',
        unit: 'jar'
      },
      {
        sku: 'HOME-DET-010',
        name: 'Eco Dishwashing Gel (750ml)',
        category: 'Household & Cleaning',
        purchasePrice: 105,
        sellingPrice: 165,
        availableStock: 35,
        reorderLevel: 12,
        isActive: true,
        description: 'Lemon power grease cutter with natural bio enzymes.',
        unit: 'bottle'
      }
    ];

    this.state.products = initialProducts.map((p, idx) => ({
      ...p,
      _id: `prd_init_${idx + 1}`,
      createdAt: isoNow,
      updatedAt: isoNow
    }));

    // Record initial movements for products with stock
    this.state.movements = [];
    for (const p of this.state.products) {
      if (p.availableStock > 0) {
        this.state.movements.push({
          _id: `mvt_init_${p._id}`,
          productId: p._id,
          productSku: p.sku,
          productName: p.name,
          type: 'STOCK_RECEIVED',
          quantity: p.availableStock,
          previousStock: 0,
          resultingStock: p.availableStock,
          userId: adminUser._id,
          userName: adminUser.fullName,
          reason: 'Initial retail inventory intake',
          timestamp: new Date(Date.now() - 3600000 * 48).toISOString(),
          createdAt: isoNow
        });
      }
    }

    // 3. Seed two historical sales for demo reports and charts
    const rice = this.state.products.find((p) => p.sku === 'GROC-BAS-001')!;
    const tea = this.state.products.find((p) => p.sku === 'BEV-TEA-003')!;
    const cable = this.state.products.find((p) => p.sku === 'ELEC-CBL-005')!;

    const sale1Items: ISaleItem[] = [
      {
        productId: rice._id,
        sku: rice.sku,
        name: rice.name,
        quantity: 2,
        unitPurchasePrice: rice.purchasePrice,
        unitSellingPrice: rice.sellingPrice,
        lineTotal: rice.sellingPrice * 2, // 1040
        lineProfit: (rice.sellingPrice - rice.purchasePrice) * 2 // 280
      },
      {
        productId: tea._id,
        sku: tea.sku,
        name: tea.name,
        quantity: 1,
        unitPurchasePrice: tea.purchasePrice,
        unitSellingPrice: tea.sellingPrice,
        lineTotal: tea.sellingPrice, // 310
        lineProfit: tea.sellingPrice - tea.purchasePrice // 90
      }
    ];

    const subtotal1 = 1350;
    const discount1 = 0;
    const tax1 = Math.round((subtotal1 * 18) / 100); // 243
    const total1 = subtotal1 + tax1; // 1593
    const cost1 = rice.purchasePrice * 2 + tea.purchasePrice; // 760 + 220 = 980
    const profit1 = subtotal1 - cost1; // 370

    const dateYesterday = new Date(Date.now() - 3600000 * 24).toISOString();

    const sale1: ISale = {
      _id: 'sal_demo_101',
      invoiceNumber: 'INV-20261015-01001',
      items: sale1Items,
      subtotal: subtotal1,
      discountPercent: 0,
      discountAmount: discount1,
      taxPercent: 18,
      taxAmount: tax1,
      totalAmount: total1,
      totalCost: cost1,
      grossProfit: profit1,
      status: 'COMPLETED',
      paymentMethod: 'UPI',
      notes: 'Customer walked in, paid via PhonePe',
      userId: staffUser._id,
      userName: staffUser.fullName,
      createdAt: dateYesterday,
      updatedAt: dateYesterday
    };

    const sale2Items: ISaleItem[] = [
      {
        productId: cable._id,
        sku: cable.sku,
        name: cable.name,
        quantity: 2,
        unitPurchasePrice: cable.purchasePrice,
        unitSellingPrice: cable.sellingPrice,
        lineTotal: cable.sellingPrice * 2, // 698
        lineProfit: (cable.sellingPrice - cable.purchasePrice) * 2 // 418
      }
    ];

    const subtotal2 = 698;
    const discount2 = Math.round((subtotal2 * 5) / 100); // 35
    const net2 = subtotal2 - discount2; // 663
    const tax2 = Math.round((net2 * 18) / 100); // 119
    const total2 = net2 + tax2; // 782
    const cost2 = cable.purchasePrice * 2; // 280
    const profit2 = net2 - cost2; // 383

    const dateToday = new Date().toISOString();

    const sale2: ISale = {
      _id: 'sal_demo_102',
      invoiceNumber: 'INV-20261016-01002',
      items: sale2Items,
      subtotal: subtotal2,
      discountPercent: 5,
      discountAmount: discount2,
      taxPercent: 18,
      taxAmount: tax2,
      totalAmount: total2,
      totalCost: cost2,
      grossProfit: profit2,
      status: 'COMPLETED',
      paymentMethod: 'CARD',
      notes: 'Express checkout at register 2',
      userId: adminUser._id,
      userName: adminUser.fullName,
      createdAt: dateToday,
      updatedAt: dateToday
    };

    this.state.sales = [sale2, sale1];
    this.state.banners = JSON.parse(JSON.stringify(DEFAULT_BANNERS));
    this.state.invoiceCounter = 1002;
    this.persist();
  }
}

export const db = new DataStore();
