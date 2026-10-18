import { Product, InventoryMovement, Sale, StoreConfig, User, CustomerUser, HeroBanner, ProductCategory } from '../types/index.ts';

const TOKEN_KEY = 'retailflow_auth_token';
const CUSTOMER_TOKEN_KEY = 'retailflow_customer_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function removeStoredToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export function getCustomerToken(): string | null {
  return localStorage.getItem(CUSTOMER_TOKEN_KEY);
}

export function setCustomerToken(token: string) {
  localStorage.setItem(CUSTOMER_TOKEN_KEY, token);
}

export function removeCustomerToken() {
  localStorage.removeItem(CUSTOMER_TOKEN_KEY);
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
  tokenPreference: 'default' | 'customer' = 'default'
): Promise<T> {
  const isCustomerEndpoint = endpoint.startsWith('/api/customer');
  const usesCustomerToken = isCustomerEndpoint || tokenPreference === 'customer';
  // Use customer token for customer endpoints; for sales checkout fallback to customer token if logged in
  const token = usesCustomerToken
    ? getCustomerToken()
    : (getStoredToken() || getCustomerToken());
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(endpoint, {
    ...options,
    headers
  });

  if (response.status === 401) {
    if (usesCustomerToken) {
      if (!endpoint.includes('/api/customer/login')) {
        removeCustomerToken();
        window.dispatchEvent(new Event('customer:unauthorized'));
      }
    } else {
      if (!endpoint.includes('/api/auth/login')) {
        removeStoredToken();
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || `HTTP error ${response.status}`;
    throw new Error(errorMsg);
  }

  return data as T;
}

class DownloadError extends Error {
  constructor(message: string, public readonly status: number) {
    super(message);
    this.name = 'DownloadError';
  }
}

async function downloadCsv(endpoint: string, defaultFilename: string): Promise<void> {
  const token = getStoredToken() || getCustomerToken();
  if (!token) {
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new DownloadError('Your session is missing or expired. Please sign in again to export this report.', 401);
  }

  const response = await fetch(endpoint, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'text/csv'
    }
  });

  if (response.status === 401) {
    removeStoredToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
  }

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new DownloadError(data.message || data.error || `Export failed (HTTP ${response.status}).`, response.status);
  }

  const contentType = response.headers.get('Content-Type') || '';
  if (!/^text\/csv(?:\s*;|$)/i.test(contentType)) {
    const data = await response.clone().json().catch(() => ({}));
    throw new DownloadError(data.message || 'The server did not return a CSV file.', response.status);
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition') || '';
  const filenameValue = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i)?.[1]?.trim();
  const filename = filenameValue
    ? decodeURIComponent(filenameValue.replace(/^"|"$/g, ''))
    : defaultFilename;
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = objectUrl;
  link.download = filename || defaultFilename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
}

export const api = {
  // Auth
  login: (identifier: string, password: string) =>
    request<{ token: string; user: User }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password })
    }),

  getMe: () => request<{ user: User }>('/api/auth/me'),

  logout: () => {
    removeStoredToken();
    return request<{ success: boolean }>('/api/auth/logout', { method: 'POST' });
  },

  getUsers: () => request<{ users: User[] }>('/api/auth/users'),

  createUser: (userData: {
    username: string;
    email: string;
    passwordPlain: string;
    role: 'admin' | 'staff';
    fullName: string;
  }) =>
    request<{ message: string; user: User }>('/api/auth/users', {
      method: 'POST',
      body: JSON.stringify({
        username: userData.username,
        email: userData.email,
        password: userData.passwordPlain,
        role: userData.role,
        fullName: userData.fullName
      })
    }),

  updateUser: (id: string, updates: { role?: 'admin' | 'staff'; isActive?: boolean }) =>
    request<{ message: string; user: User }>(`/api/auth/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(updates)
    }),

  // Products
  getProducts: (params?: {
    search?: string;
    category?: string;
    stockStatus?: string;
    isActive?: boolean;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    forPos?: boolean;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.category && params.category !== 'all') query.set('category', params.category);
    if (params?.stockStatus && params.stockStatus !== 'all') query.set('stockStatus', params.stockStatus);
    if (params?.isActive !== undefined) query.set('isActive', String(params.isActive));
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.sortBy) query.set('sortBy', params.sortBy);
    if (params?.sortOrder) query.set('sortOrder', params.sortOrder);
    if (params?.forPos) query.set('forPos', 'true');
    return request<{
      products: Product[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/products?${query.toString()}`);
  },

  getCategories: () => request<{ categories: string[] }>('/api/products/categories'),

  getPosCategories: () => request<{ categories: string[] }>('/api/products/categories/pos'),

  getManagedCategories: () => request<{ categories: ProductCategory[] }>('/api/products/categories/manage'),

  createCategory: (name: string, showInPos = true) =>
    request<{ category: ProductCategory; categories: ProductCategory[] }>('/api/products/categories/manage', {
      method: 'POST',
      body: JSON.stringify({ name, showInPos })
    }),

  updateCategory: (id: string, name: string, showInPos: boolean) =>
    request<{ category: ProductCategory; categories: ProductCategory[] }>(`/api/products/categories/manage/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: JSON.stringify({ name, showInPos })
    }),

  deleteCategory: (id: string) =>
    request<{ message: string; categories: ProductCategory[] }>(`/api/products/categories/manage/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    }),

  getProduct: (id: string) => request<{ product: Product }>(`/api/products/${id}`),

  createProduct: (data: {
    sku: string;
    name: string;
    category: string;
    purchasePrice: number;
    sellingPrice: number;
    availableStock?: number;
    reorderLevel?: number;
    description?: string;
    unit?: string;
  }) =>
    request<{ message: string; product: Product }>('/api/products', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  updateProduct: (
    id: string,
    data: {
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
  ) =>
    request<{ message: string; product: Product }>(`/api/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    }),

  setProductStatus: (id: string, isActive: boolean) =>
    request<{ message: string; product: Product }>(`/api/products/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ isActive })
    }),

  uploadProductImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return request<{
      message: string;
      imageUrl: string;
      imagePublicId: string;
      product: Product;
    }>(`/api/products/${id}/image`, {
      method: 'POST',
      body: formData
    });
  },

  removeProductImage: (id: string) =>
    request<{ message: string; product: Product }>(`/api/products/${id}/image`, {
      method: 'DELETE'
    }),

  generateProductImage: (id: string) =>
    request<{
      success: boolean;
      message: string;
      imageUrl: string;
      product: Product;
    }>(`/api/products/${id}/generate-image`, {
      method: 'POST'
    }),

  // Inventory
  getLowStock: () =>
    request<{
      summary: { totalAlerts: number; outOfStockCount: number; lowStockCount: number };
      products: Product[];
    }>('/api/inventory/low-stock'),

  adjustInventory: (data: {
    productId: string;
    adjustmentType: 'STOCK_RECEIVED' | 'MANUAL_INCREASE' | 'MANUAL_DECREASE';
    quantity: number;
    reason: string;
  }) =>
    request<{ message: string; product: Product; movement: InventoryMovement }>('/api/inventory/adjustments', {
      method: 'POST',
      body: JSON.stringify(data)
    }),

  getMovements: (params?: {
    productId?: string;
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.productId) query.set('productId', params.productId);
    if (params?.type && params.type !== 'all') query.set('type', params.type);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{
      movements: InventoryMovement[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/inventory/movements?${query.toString()}`);
  },

  // Sales
  createSale: (data: {
    items: Array<{ productId: string; quantity: number }>;
    discountPercent?: number;
    paymentMethod?: 'CASH' | 'CARD' | 'UPI' | 'CREDIT';
    notes?: string;
    customerName?: string;
    customerPhone?: string;
    customerEmail?: string;
  }, asCustomer = false) =>
    request<{ message: string; sale: Sale }>('/api/sales', {
      method: 'POST',
      body: JSON.stringify(data)
    }, asCustomer ? 'customer' : 'default'),

  getSales: (params?: {
    search?: string;
    startDate?: string;
    endDate?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set('search', params.search);
    if (params?.startDate) query.set('startDate', params.startDate);
    if (params?.endDate) query.set('endDate', params.endDate);
    if (params?.status && params.status !== 'all') query.set('status', params.status);
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    return request<{
      sales: Sale[];
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    }>(`/api/sales?${query.toString()}`);
  },

  getSale: (id: string) => request<{ sale: Sale }>(`/api/sales/${id}`),

  returnSale: (id: string, reason: string) =>
    request<{ message: string; sale: Sale; returnedMovements: InventoryMovement[] }>(`/api/sales/${id}/return`, {
      method: 'POST',
      body: JSON.stringify({ reason })
    }),

  // Reports
  downloadCsv,

  getSalesReport: (startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);
    return request<{
      period: { startDate: string; endDate: string };
      summary: {
        totalSalesAmount: number;
        totalSubtotal: number;
        totalDiscount: number;
        totalTax: number;
        totalTransactions: number;
        returnedTransactions: number;
        averageOrderValue: number;
      };
      topSellingProducts: Array<{
        productId: string;
        sku: string;
        name: string;
        quantitySold: number;
        totalRevenue: number;
      }>;
      salesTimeline: Array<{ date: string; sales: number; count: number }>;
    }>(`/api/reports/sales?${query.toString()}`);
  },

  getProfitReport: (startDate?: string, endDate?: string) => {
    const query = new URLSearchParams();
    if (startDate) query.set('startDate', startDate);
    if (endDate) query.set('endDate', endDate);
    return request<{
      period: { startDate: string; endDate: string };
      metrics: {
        totalRevenue: number;
        totalNetRevenue: number;
        totalCost: number;
        grossProfit: number;
        grossMarginPercent: number;
        transactionsAnalyzed: number;
      };
      categoryBreakdown: Array<{
        category: string;
        revenue: number;
        cost: number;
        profit: number;
        unitsSold: number;
        marginPercent: number;
      }>;
    }>(`/api/reports/profit?${query.toString()}`);
  },

  // Config & Database
  getConfig: () => request<{ config: StoreConfig }>('/api/config'),

  updateConfig: (config: Partial<StoreConfig>) =>
    request<{ message: string; config: StoreConfig }>('/api/config', {
      method: 'PUT',
      body: JSON.stringify(config)
    }),

  // Customer Auth & Orders
  customerRegister: (fullName: string, email: string, password: string) =>
    request<{ message: string; token: string; customer: CustomerUser }>('/api/customer/register', {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password })
    }),

  customerLogin: (email: string, password: string) =>
    request<{ message: string; token: string; customer: CustomerUser }>('/api/customer/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    }),

  customerDemoLogin: () =>
    request<{ message: string; token: string; customer: CustomerUser }>('/api/customer/demo-login', {
      method: 'POST'
    }),

  getCustomerMe: () =>
    request<{ customer: CustomerUser }>('/api/customer/me'),

  customerLogout: () => {
    removeCustomerToken();
    return request<{ success: boolean }>('/api/customer/logout', { method: 'POST' });
  },

  getCustomerOrders: () =>
    request<{ orders: Sale[] }>('/api/customer/orders'),

  // Hero Banners
  getBanners: (all?: boolean) =>
    request<{ banners: HeroBanner[] }>(`/api/banners${all ? '?all=true' : ''}`),

  getBannerById: (id: string) =>
    request<{ banner: HeroBanner }>(`/api/banners/${id}`),

  createBanner: (bannerData: Partial<HeroBanner>) =>
    request<{ message: string; banner: HeroBanner }>('/api/banners', {
      method: 'POST',
      body: JSON.stringify(bannerData)
    }),

  updateBanner: (id: string, bannerData: Partial<HeroBanner>) =>
    request<{ message: string; banner: HeroBanner }>(`/api/banners/${id}`, {
      method: 'PUT',
      body: JSON.stringify(bannerData)
    }),

  uploadBannerImage: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return request<{
      message: string;
      imageUrl: string;
      imagePublicId: string;
      banner: HeroBanner;
    }>(`/api/banners/${id}/image`, {
      method: 'POST',
      body: formData
    });
  },

  removeBannerImage: (id: string) =>
    request<{ message: string; banner: HeroBanner }>(`/api/banners/${id}/image`, {
      method: 'DELETE'
    }),

  deleteBanner: (id: string) =>
    request<{ message: string; deletedId: string }>(`/api/banners/${id}`, {
      method: 'DELETE'
    }),

  reorderBanners: (orderedIds: string[]) =>
    request<{ message: string; banners: HeroBanner[] }>('/api/banners/reorder', {
      method: 'POST',
      body: JSON.stringify({ orderedIds })
    }),

  resetDefaultBanners: () =>
    request<{ message: string; banners: HeroBanner[] }>('/api/banners/reset-defaults', {
      method: 'POST'
    })
};
