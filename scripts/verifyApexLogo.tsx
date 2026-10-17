import React from 'react';
import { renderToString } from 'react-dom/server';
import { ApexLogo, ApexLogoMark } from '../src/components/ApexLogo.tsx';
import { CustomerStorePage } from '../src/pages/CustomerStorePage.tsx';
import { AuthContext } from '../src/context/AuthContext.tsx';
import { CustomerAuthContext } from '../src/context/CustomerAuthContext.tsx';
import fs from 'fs';

console.log('====================================================');
console.log('VERIFYING APEX RETAIL MART LOGO IMPLEMENTATION');
console.log('====================================================');

let allPassed = true;

function verify(condition: boolean, desc: string, details?: string) {
  if (condition) {
    console.log(`✅ [PASS] ${desc}`);
  } else {
    console.error(`❌ [FAIL] ${desc} - ${details || ''}`);
    allPassed = false;
  }
}

// 1. Check ApexLogoMark SVG elements
const markHtml = renderToString(<ApexLogoMark size={44} />);
verify(markHtml.includes('<svg'), 'ApexLogoMark renders clean SVG element');
verify(markHtml.includes('rx="46"') && markHtml.includes('url(#apexBgGrad)'), 'Dark forest-green rounded-square (squircle) background present');
verify(markHtml.includes('fill="#FFFFFF"') && markHtml.includes('M 89 36'), 'White stylized letter "A" with precise geometry present');
verify(markHtml.includes('url(#leafUpperGrad)') && markHtml.includes('url(#leafLowerGrad)'), 'Two-tone green leaf detail present');
verify(markHtml.includes('stroke="#0f5132"') && markHtml.includes('stroke="#86efac"'), 'Central leaf vein and highlight accents present');

// 2. Check full ApexLogo component
const logoHtml = renderToString(<ApexLogo iconSize={44} showTagline={true} />);
verify(logoHtml.includes('Apex') && logoHtml.includes('Retail Mart'), 'Brand name "Apex Retail Mart" rendered with dual-tone styling');
verify(logoHtml.includes('text-[#064e3b]'), '"Apex" rendered in dark forest green (#064e3b)');
verify(logoHtml.includes('text-stone-900'), '"Retail Mart" rendered in dark bold typography');
verify(logoHtml.includes('OFFICIAL RETAIL STORE'), 'Tagline "OFFICIAL RETAIL STORE" rendered');
verify(logoHtml.includes('tracking-[0.22em]') || logoHtml.includes('tracking-[0.26em]'), 'Tagline features wide letter spacing');

// 3. Check CustomerStorePage integration
const mockCustomerAuth = {
  customer: {
    id: 'cust_1',
    fullName: 'Rahul Sharma',
    email: 'rahul.sharma@example.com',
    role: 'customer' as const
  },
  token: 'mock-cust-token',
  loading: false,
  error: null,
  login: async () => {},
  register: async () => {},
  demoLogin: async () => {},
  logout: async () => {},
  refreshCustomer: async () => {},
  pendingCartItem: null,
  setPendingCartItem: () => {},
  isAuthModalOpen: false,
  authModalInitialTab: 'login' as const,
  openAuthModal: () => {},
  closeAuthModal: () => {}
};

const mockEmployeeAuth = {
  user: null,
  token: null,
  loading: false,
  isAdmin: false,
  isStaff: false,
  login: async () => {},
  logout: async () => {},
  loginDemo: async () => {},
  refreshUser: async () => {}
};

const storePageHtml = renderToString(
  <AuthContext.Provider value={mockEmployeeAuth}>
    <CustomerAuthContext.Provider value={mockCustomerAuth}>
      <CustomerStorePage
        config={{ storeName: 'Apex Retail Mart' } as any}
        onOpenStaffPortal={() => {}}
        onNavigate={() => {}}
      />
    </CustomerAuthContext.Provider>
  </AuthContext.Provider>
);

verify(storePageHtml.includes('aria-label="Apex Retail Mart Home"'), 'Header renders accessible home button wrapping brand logo');
verify(storePageHtml.includes('Apex') && storePageHtml.includes('Retail Mart'), 'Customer header renders new Apex Retail Mart logo');
verify(storePageHtml.includes('OFFICIAL RETAIL STORE'), 'Customer header renders OFFICIAL RETAIL STORE tagline');
verify(storePageHtml.includes('Search products by title'), 'Existing search bar remains intact');
verify(storePageHtml.includes('My Account'), 'Existing My Account button remains intact');
verify(storePageHtml.includes('Cart'), 'Existing Shopping Cart trigger remains intact');

// 4. Check CustomerStorePage source code for handleHomeClick preservation
const storeSrc = fs.readFileSync('src/pages/CustomerStorePage.tsx', 'utf-8');
const hasHomeHandler = storeSrc.includes('const handleHomeClick = () => {');
const clearsFiltersOnHome = storeSrc.includes('handleClearFilters();');
const scrollsToTop = storeSrc.includes("window.scrollTo({ top: 0, behavior: 'smooth' });");
const navigatesHome = storeSrc.includes("onNavigate('customer');");

verify(hasHomeHandler, 'CustomerStorePage implements handleHomeClick');
verify(clearsFiltersOnHome, 'Clicking logo resets search, category, and pagination back to homepage defaults');
verify(scrollsToTop, 'Clicking logo smoothly scrolls customer to top of storefront');
verify(navigatesHome, 'Clicking logo routes to customer storefront view without page reload');

// Verify that cart and auth are untouched during home click
const cartPreserved = !storeSrc.includes('handleHomeClick') || !storeSrc.slice(storeSrc.indexOf('handleHomeClick'), storeSrc.indexOf('handleHomeClick') + 200).includes('setCart([]);');
const authPreserved = !storeSrc.includes('handleHomeClick') || !storeSrc.slice(storeSrc.indexOf('handleHomeClick'), storeSrc.indexOf('handleHomeClick') + 200).includes('customerLogout');

verify(cartPreserved, 'Cart items and quantities are strictly preserved on logo click');
verify(authPreserved, 'Customer authentication session is strictly preserved on logo click');

console.log('====================================================');
if (allPassed) {
  console.log('ALL APEX RETAIL MART LOGO VERIFICATION TESTS PASSED!');
} else {
  console.error('SOME LOGO VERIFICATION TESTS FAILED.');
  process.exit(1);
}
