# RetailFlow / Apex Retail Mart — Retail Inventory & Sales Management System

> Full-Stack Retail POS, Multi-Product Inventory Management, Authoritative Pricing Engine, Cloudinary Asset Management, and Customer Storefront.

---

## 1. Project Overview & Architecture

**RetailFlow** (storefront branded as **Apex Retail Mart**) is an enterprise-grade, full-stack retail management platform built for high-throughput retail stores, electronics shops, and supermarkets. The application addresses critical inventory and point-of-sale challenges including race-condition overselling, price tampering, auditability of manual stock changes, fiscal compliance (GST invoicing), image asset management, and promotional marketing.

### Core Architectural Principles
1. **Server-Authoritative Pricing & Totals**: The client submits only `productId` and `quantity`. Unit selling prices, subtotal, customer/staff discounts, GST tax amounts, and grand totals are calculated exclusively on the server using active catalog rates. Client-submitted prices are completely ignored.
2. **Atomic Multi-Item Stock Deductions**: Multi-product checkout is wrapped in an atomic transaction with concurrency locks. If any single line item lacks sufficient stock or is deactivated, the entire transaction is rolled back with zero inventory deducted.
3. **Snapshot Freezing**: When an invoice is finalized, both the selling price and the cost of goods sold (COGS unit purchase price) are frozen into the sale record. Subsequent catalog price edits or supplier cost changes never alter historical invoices or profit margins.
4. **Immutable Audit Trail**: Every stock change (`STOCK_RECEIVED`, `MANUAL_INCREASE`, `MANUAL_DECREASE`, `SALE`, `SALE_RETURN`) creates an unmodifiable audit movement record with user identity, previous stock, resulting stock, and mandatory justification notes.
5. **Secure Cloudinary Asset Management**: Product and banner images are streamed to Cloudinary exclusively through authenticated backend endpoints. Secrets are never exposed to the client. Asset replacements follow a safe transactional sequence: new image upload $\rightarrow$ database commit $\rightarrow$ old asset cleanup.
6. **Dual Data Persistence**: Seamless zero-configuration development via an embedded atomic JSON datastore (`data/retail_db.json`) alongside production MongoDB support via Mongoose (`server/models/mongooseSchemas.ts`).

---

## 2. Technology Stack & Actual Versions

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | **React** | `^19.0.1` | Modern functional component architecture with hooks |
| **Frontend DOM** | **React DOM** | `^19.0.1` | Client-side DOM rendering and server-side test rendering |
| **Language** | **TypeScript** | `^7.0.2` | Full static type safety across client and server |
| **Bundler & Build Tool** | **Vite** | `^8.3.0` | Ultra-fast HMR and optimized production ES builds |
| **CSS Framework** | **Tailwind CSS** | `^4.3.3` | Modern utility styling via `@tailwindcss/vite` |
| **Icons** | **Lucide React** | `^0.546.0` | Crisp SVG icon set for POS, inventory, and navigation |
| **Animations** | **Motion** | `^12.23.24` | Smooth interactive animations and drawer transitions |
| **Backend Framework** | **Express.js** | `^4.21.2` | RESTful API server with modular routing and error handling |
| **Runtime & Execution** | **Node.js / tsx** | `tsx ^4.21.0` | TypeScript execution without precompilation overhead |
| **Database & ODM** | **Mongoose / MongoDB** | `^9.11.2` | Schema models, unique indexing, and document validation |
| **Password Hashing** | **bcryptjs** | `^3.0.3` | 10-round salted password hashing for all user roles |
| **Authentication** | **jsonwebtoken** | `^9.0.3` | Cryptographically signed HMAC-SHA256 JWT sessions |
| **File Uploads** | **Multer** | `^2.4.0` | In-memory buffer streaming for multipart form data |
| **Cloud Asset Storage** | **Cloudinary** | `^2.11.0` | Cloudinary v2 SDK for secure media management |

---


## 4. Directory Structure

```
├── data/
│   ├── .gitkeep                     # Keeps data folder in clean git clone
│   └── retail_db.json               # Embedded atomic datastore (seeded automatically on startup)
├── scripts/
│   ├── seed.ts                      # Manual seed script for catalog & demo users
│   ├── verifyApexLogo.tsx           # Logo reproduction and brand alignment tests
│   ├── verifyCustomerTests.ts       # Customer authentication and portal isolation tests (8 tests)
│   ├── verifyFinalAcceptance.tsx    # Header layout, profile, and 8-viewport acceptance tests (29 tests)
│   ├── verifyHeaderLayout.tsx       # Profile trigger and dropdown behavior tests
│   └── verifyTests.ts               # Core system acceptance test suite (35 tests)
├── server/
│   ├── db/
│   │   ├── connection.ts            # Mongoose connection & fallback data store initializer
│   │   └── dataStore.ts             # Atomic transactional engine with mutex concurrency locks
│   ├── middleware/
│   │   ├── auth.ts                  # JWT verification & role guards (requireAdmin, requireStaff)
│   │   └── errorHandler.ts          # Centralized error response formatter
│   ├── models/
│   │   └── mongooseSchemas.ts       # Mongoose schemas with strict validations & unique indexes
│   ├── routes/
│   │   ├── authRoutes.ts            # Employee authentication & user administration
│   │   ├── bannerRoutes.ts          # Hero carousel & promotional banner management
│   │   ├── configRoutes.ts          # Store configuration, GSTIN, and tax rates
│   │   ├── customerRoutes.ts        # Customer registration, login, and isolated order history
│   │   ├── inventoryRoutes.ts       # Stock intake, adjustments, and immutable movement log
│   │   ├── productRoutes.ts         # Product catalog, CRUD, SKU validation, Cloudinary uploads
│   │   ├── reportRoutes.ts          # Sales analytics, gross profit calculations, CSV exports
│   │   └── salesRoutes.ts           # POS cart checkout, invoice retrieval, sales returns
│   ├── services/
│   │   └── cloudinary.ts            # Secure Cloudinary streaming service & file validation
│   └── types/
│       └── index.ts                 # Server-side TypeScript interfaces and domain enums
├── src/
│   ├── api/
│   │   └── client.ts                # Strongly-typed Axios/Fetch REST client with JWT interceptor
│   ├── components/
│   │   ├── ApexLogo.tsx             # Pixel-accurate Apex Retail Mart brand logo & SVG mark
│   │   ├── CartDrawer.tsx           # Customer slide-out cart drawer
│   │   ├── CustomerAuthModal.tsx    # Customer login & registration modal
│   │   ├── CustomerOrdersModal.tsx  # Customer personal order history modal
│   │   ├── Header.tsx               # 3-Zone responsive admin/staff navigation bar
│   │   ├── HeroCarousel.tsx         # Storefront promotional banner carousel
│   │   ├── PrintInvoiceModal.tsx    # Print-ready thermal tax invoice receipt
│   │   ├── ProductImage.tsx         # Resilient Cloudinary image component with graceful fallback
│   │   ├── ProductModal.tsx         # Add/Edit product modal with SKU generator
│   │   ├── ProductQuickViewModal.tsx# Fast product preview modal for storefront
│   │   └── StockAdjustmentModal.tsx # Stock intake & audit adjustment modal
│   ├── context/
│   │   ├── AuthContext.tsx          # Employee authentication context & session management
│   │   └── CustomerAuthContext.tsx  # Customer storefront authentication context
│   ├── pages/
│   │   ├── BannersPage.tsx          # Hero banner management with live search & status filters
│   │   ├── CustomerAccountPage.tsx  # Customer profile & order review
│   │   ├── CustomerAuthPage.tsx     # Dedicated customer sign-in/register page
│   │   ├── CustomerStorePage.tsx    # Customer storefront catalog, search, and cart
│   │   ├── DashboardPage.tsx        # Executive KPIs, top products, low stock alerts, revenue chart
│   │   ├── InventoryPage.tsx        # Auditable movement ledger & low-stock view
│   │   ├── LoginPage.tsx            # Staff/Admin login with 1-click evaluation access
│   │   ├── PosPage.tsx              # Point of Sale multi-product cart checkout
│   │   ├── ProductsPage.tsx         # Product catalog table, SKU search, category/stock filters
│   │   ├── ReportsPage.tsx          # Gross profit reports, date range selector, CSV export
│   │   ├── SalesPage.tsx            # Historical invoice browser & sales return handler
│   │   └── SettingsPage.tsx         # Employee provisioning & fiscal store settings
│   ├── types/
│   │   └── index.ts                 # Frontend domain definitions and state types
│   ├── App.tsx                      # Root component, routing, and portal switcher
│   ├── index.css                    # Tailwind CSS imports and print media formatting
│   └── main.tsx                     # React 19 entry point
├── .env.example                     # Comprehensive environment variable template
├── .gitignore                       # Production Git ignore patterns
├── index.html                       # HTML5 application shell
├── metadata.json                    # AI Studio applet metadata
├── package.json                     # Dependencies, scripts, and engine specifications
├── server.ts                        # Unified Express + Vite server entry point
├── tsconfig.json                    # Strict TypeScript compiler configuration
└── vite.config.ts                   # Vite configuration with React and Tailwind plugins
```

---

## 5. Setup & Running the Application

### Prerequisites
- **Node.js**: Version $\ge$ 18.x (tested on Node 20.x / 22.x)
- **npm**: Version $\ge$ 9.x
- *(Optional)* **MongoDB**: Local MongoDB instance (`mongodb://localhost:27017/retail_inventory`) or MongoDB Atlas URI. If omitted or unreachable, the system automatically uses the embedded atomic datastore (`data/retail_db.json`) with zero configuration.

### 1. Installation
Clone the repository and install all dependencies:
```bash
git clone https://github.com/<your-username>/retail-inventory-sales-management.git
cd retail-inventory-sales-management
npm install
```

### 2. Environment Configuration
Copy the sample environment file to create your local `.env`:
```bash
cp .env.example .env
```

Review and adjust configuration parameters in `.env`:
```ini
# Server Port
PORT=3000

# Authentication (32+ character high-entropy key)
JWT_SECRET="your-super-secret-jwt-key-replace-in-production"
JWT_EXPIRES_IN="7d"

# MongoDB Database Connection String (optional fallback to embedded JSON store)
MONGODB_URI="mongodb://localhost:27017/retail_inventory"

# Store & Fiscal Defaults
DEFAULT_CURRENCY="INR"
DEFAULT_TAX_RATE_PERCENT="18"
DEFAULT_DISCOUNT_PERCENT="0"
STORE_NAME="Apex Retail Mart"
STORE_ADDRESS="Plot 42, Commercial Avenue, Sector 5"
STORE_GSTIN="07AAAAA0000A1Z5"

# Cloudinary Integration (Product & Banner Images)
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
CLOUDINARY_FOLDER="retailflow/products"
MAX_IMAGE_SIZE_MB="5"
```

### 3. Running in Development
Start the unified Express API server and Vite frontend:
```bash
npm run dev
```
Open **`http://localhost:3000`** in your browser.

### 4. Running Production Build
```bash
npm run build
npm start
```

---

## 6. Seed Accounts & Demo Credentials

The database automatically initializes default accounts upon first boot:

| Role | Username / Email | Password | Full Name | Access Level |
| :--- | :--- | :--- | :--- | :--- |
| **Admin** | `admin` (`admin@apexretail.local`) | `ADMIN` | Store Manager: Full catalog, pricing, adjustments, settings, profit reports, Cloudinary uploads |
| **Staff** | `staff` (`staff@apexretail.local`) | `STAFF` | Cashier: POS checkout, product lookups, receipt generation (no cost price access or inventory adjustments) |
| **Customer** | `customer@example.com` | `Customer123!` |   Customer Storefront: Public shopping, cart, personal order history |

> **Convenience Feature**: The Login screen (`/login`) includes 1-click quick-fill buttons for both **Admin** and **Staff** credentials to streamline evaluation.

---

## 7. REST API Reference

### Base URL: `/api`

### Authentication & Employee Management (`/api/auth`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | Staff/Admin login (username or email + password); returns JWT token and user profile |
| `GET` | `/api/auth/me` | Authenticated | Validate session and retrieve authenticated profile |
| `POST` | `/api/auth/logout` | Authenticated | Clear user session |
| `POST` | `/api/auth/init-admin` | Public | One-time bootstrap endpoint for initial administrator provisioning |
| `GET` | `/api/auth/users` | Admin only | List all employee accounts |
| `POST` | `/api/auth/users` | Admin only | Provision a new staff or admin user |
| `PATCH` | `/api/auth/users/:id` | Admin only | Toggle employee role or active/inactive status |

### Customer Storefront Portal (`/api/customers`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/customers/register` | Public | Register a new customer account |
| `POST` | `/api/customers/login` | Public | Customer sign-in; returns customer JWT token |
| `GET` | `/api/customers/me` | Customer | Retrieve customer profile |
| `GET` | `/api/customers/orders` | Customer | Retrieve isolated personal order history |

### Product Catalog (`/api/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/products` | Public / Auth | Search, category filter, stock status filter, pagination, and sorting |
| `GET` | `/api/products/categories` | Public | List distinct product categories |
| `GET` | `/api/products/cloudinary-status` | Public | Check Cloudinary configuration and upload parameters |
| `GET` | `/api/products/:id` | Public / Auth | Get product details by ID |
| `POST` | `/api/products` | Admin only | Create a new product with a unique SKU |
| `PUT` | `/api/products/:id` | Admin only | Edit product details or pricing |
| `PATCH` | `/api/products/:id/status` | Admin only | Soft deactivate or reactivate a product |
| `POST` | `/api/products/:id/image` | Admin only | Upload/replace product image in Cloudinary |
| `DELETE` | `/api/products/:id/image` | Admin only | Remove image from Cloudinary and database |

### Inventory & Stock Movements (`/api/inventory`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/inventory/low-stock` | Authenticated | Retrieve products where `availableStock <= reorderLevel` |
| `POST` | `/api/inventory/adjustments` | Admin only | Ingest vendor stock (`STOCK_RECEIVED`) or log adjustments (`MANUAL_INCREASE`, `MANUAL_DECREASE`) |
| `GET` | `/api/inventory/movements` | Authenticated | Retrieve immutable audit movement log with type/date filters |

### Sales & Point of Sale (`/api/sales`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/sales` | Authenticated | Checkout multi-product cart (atomic deduction, server pricing, invoice creation) |
| `GET` | `/api/sales` | Authenticated | Paginated sales records with date/status filters |
| `GET` | `/api/sales/:id` | Authenticated | Retrieve itemized invoice details |
| `POST` | `/api/sales/:id/return` | Admin only | Process customer return, restock items, log `SALE_RETURN` movement |

### Reports & Analytics (`/api/reports`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/reports/sales` | Authenticated | Aggregate sales revenue, order counts, timeline, top products |
| `GET` | `/api/reports/profit` | Admin only | Gross profit and margin % analysis using purchase-cost snapshots |
| `GET` | `/api/reports/export/sales.csv` | Admin only | Download sales ledger in CSV format |
| `GET` | `/api/reports/export/inventory.csv` | Admin only | Download inventory valuation and stock levels in CSV format |

### Store Configuration (`/api/config`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/config` | Public | Retrieve public store information (name, address, GSTIN, default tax) |
| `PUT` | `/api/config` | Admin only | Update fiscal configuration and tax parameters |

### Hero Banners (`/api/banners`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/banners` | Public | Retrieve active promotional banners for storefront |
| `GET` | `/api/banners/admin` | Admin only | Retrieve all banners including inactive items |
| `POST` | `/api/banners` | Admin only | Create banner (Option A image-only or Option B custom) |
| `PUT` | `/api/banners/:id` | Admin only | Update banner details and styling |
| `PATCH` | `/api/banners/:id/status` | Admin only | Toggle banner active/inactive visibility |
| `POST` | `/api/banners/reorder` | Admin only | Update banner display sequence |
| `POST` | `/api/banners/:id/image` | Admin only | Upload banner artwork to Cloudinary |
| `DELETE` | `/api/banners/:id` | Admin only | Delete banner and remove Cloudinary asset |
| `POST` | `/api/banners/reset-defaults` | Admin only | Reset carousel to default templates |

---

- **System**: Retail Inventory & Sales Management System (RetailFlow / Apex Retail Mart)
- **License**: MIT License
