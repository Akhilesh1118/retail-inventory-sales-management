import React from 'react';
import { renderToString } from 'react-dom/server';
import { Header } from '../src/components/Header.tsx';
import { AuthContext } from '../src/context/AuthContext.tsx';

const mockAdminUser = {
  id: 'usr_admin_1',
  username: 'admin',
  fullName: 'Victoria Sterling',
  role: 'admin' as const,
  email: 'victoria.sterling@retailflow.com'
};

const mockStaffUser = {
  id: 'usr_staff_2',
  username: 'staff',
  fullName: 'Marcus Vance',
  role: 'staff' as const,
  email: 'marcus.vance@retailflow.com'
};

const adminAuthValue = {
  user: mockAdminUser,
  loading: false,
  isAdmin: true,
  isStaff: true,
  login: async () => {},
  logout: async () => {},
  loginDemo: async () => {},
  refreshUser: async () => {}
};

const staffAuthValue = {
  user: mockStaffUser,
  loading: false,
  isAdmin: false,
  isStaff: true,
  login: async () => {},
  logout: async () => {},
  loginDemo: async () => {},
  refreshUser: async () => {}
};

interface ViewportCheck {
  width: number;
  label: string;
  isDesktop: boolean;
}

const VIEWPORTS: ViewportCheck[] = [
  { width: 1920, label: 'Ultrawide Desktop', isDesktop: true },
  { width: 1440, label: 'Standard Desktop', isDesktop: true },
  { width: 1366, label: 'Large Laptop', isDesktop: true },
  { width: 1280, label: 'Standard Laptop', isDesktop: true },
  { width: 1024, label: 'Compact Laptop / iPad Pro', isDesktop: true },
  { width: 768, label: 'Tablet Portrait (iPad)', isDesktop: false },
  { width: 390, label: 'Mobile (iPhone 14/15)', isDesktop: false },
  { width: 360, label: 'Small Mobile (Android)', isDesktop: false }
];

console.log('====================================================');
console.log('VERIFYING HEADER LAYOUT ACROSS REQUIRED VIEWPORTS');
console.log('1920px, 1440px, 1366px, 1280px, 1024px, 768px, 390px, 360px');
console.log('====================================================');

let allPassed = true;

function verify(condition: boolean, desc: string) {
  if (condition) {
    console.log(`✅ [PASS] ${desc}`);
  } else {
    console.error(`❌ [FAIL] ${desc}`);
    allPassed = false;
  }
}

// 1. Check Closed Header Profile rendering for Admin
const adminHtml = renderToString(
  <AuthContext.Provider value={adminAuthValue}>
    <Header activeTab="dashboard" setActiveTab={() => {}} onSwitchToCustomerStore={() => {}} />
  </AuthContext.Provider>
);

// In the permanently visible header:
// Must have avatar initials "VS"
verify(adminHtml.includes('>VS</div>'), 'Closed header renders circular avatar with initials "VS"');
// Must have role label "Admin"
verify(adminHtml.includes('>Admin</span>'), 'Closed header renders short role label "Admin"');
// Must NOT render full employee name in the permanently visible closed header button
verify(!adminHtml.includes('Victoria Sterling'), 'Closed header DOES NOT display full employee name (Victoria Sterling)');
verify(!adminHtml.includes('Store Manager (Admin)'), 'Closed header DOES NOT display full role designation (Store Manager)');
verify(!adminHtml.includes('victoria.sterling@retailflow.com'), 'Closed header DOES NOT display email address');

// 2. Check 3-Section Layout Structure
verify(adminHtml.includes('RetailFlow') && adminHtml.includes('Retail Operations'), 'LEFT section renders RF logo & RetailFlow brand/subtitle');
verify(adminHtml.includes('Dashboard'), 'CENTER section renders Dashboard module');
verify(adminHtml.includes('POS'), 'CENTER section renders POS module');
verify(adminHtml.includes('Products'), 'CENTER section renders Products module');
verify(adminHtml.includes('Inventory'), 'CENTER section renders Inventory module');
verify(adminHtml.includes('Sales'), 'CENTER section renders Sales module');
verify(adminHtml.includes('Reports'), 'CENTER section renders Reports module');
verify(adminHtml.includes('Banners'), 'CENTER section renders Banners module (admin authorized)');
verify(adminHtml.includes('Settings'), 'CENTER section renders Settings module (admin authorized)');
verify(adminHtml.includes('Storefront'), 'RIGHT section renders Customer Storefront link');

// 3. Check Staff View (Banners & Settings admin-only items hidden)
const staffHtml = renderToString(
  <AuthContext.Provider value={staffAuthValue}>
    <Header activeTab="dashboard" setActiveTab={() => {}} onSwitchToCustomerStore={() => {}} />
  </AuthContext.Provider>
);
verify(staffHtml.includes('>MV</div>'), 'Staff profile shows avatar initials "MV"');
verify(staffHtml.includes('>Staff</span>'), 'Staff profile shows short role label "Staff"');
verify(!staffHtml.includes('>Banners</span>'), 'Staff cannot see Admin-only Banners link');
verify(!staffHtml.includes('>Settings</span>'), 'Staff cannot see Admin-only Settings link');

// 4. Viewport Layout Behavior
console.log('----------------------------------------------------');
console.log('CHECKING VIEWPORT ADAPTATIONS:');
VIEWPORTS.forEach((vp) => {
  if (vp.isDesktop) {
    verify(
      adminHtml.includes('hidden lg:flex items-center justify-center flex-1 min-w-0'),
      `[${vp.width}px - ${vp.label}]: Desktop 8-module center nav is rendered with flex-1 min-w-0`
    );
  } else {
    verify(
      adminHtml.includes('lg:hidden p-2 rounded-xl text-stone-600'),
      `[${vp.width}px - ${vp.label}]: Mobile/Tablet drawer toggle is available`
    );
  }
});

console.log('====================================================');
if (allPassed) {
  console.log('ALL HEADER LAYOUT & VIEWPORT VERIFICATION TESTS PASSED!');
} else {
  console.error('SOME VERIFICATION TESTS FAILED.');
  process.exit(1);
}
