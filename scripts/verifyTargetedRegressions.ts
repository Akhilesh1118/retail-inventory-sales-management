import { db } from '../server/db/dataStore.ts';

type Check = { name: string; passed: boolean; detail?: string };
const checks: Check[] = [];
function check(name: string, passed: boolean, detail = '') {
  checks.push({ name, passed, detail });
  console.log(`${passed ? 'PASS' : 'FAIL'} ${name}${detail ? `: ${detail}` : ''}`);
}

if (!process.env.RETAIL_DATA_DIR) {
  throw new Error('Set RETAIL_DATA_DIR to a disposable test directory before running targeted regressions.');
}

await db.init();

// Banner data is persisted only in RETAIL_DATA_DIR; image URLs here are fixtures and never contact Cloudinary.
const defaults = db.getBanners(true);
check('default banner fixture', defaults.length >= 5);

const banner = await db.createBanner({
  title: 'Regression banner',
  description: 'Targeted async regression test',
  categoryKey: 'all',
  isActive: true
});
check('async banner creation returns created record', db.getBannerById(banner._id)?.title === 'Regression banner');

const imageUrl = 'https://res.cloudinary.com/example/image/upload/test-fixture.jpg';
const withImage = await db.setBannerImage(banner._id, imageUrl, 'test-fixture');
check('async banner image update returns stored image fields', withImage.imageUrl === imageUrl && withImage.imagePublicId === 'test-fixture');

const updated = await db.updateBanner(banner._id, { title: 'Updated regression banner', isActive: false });
check('async banner update returns updated record', updated.title === 'Updated regression banner' && !updated.isActive);
check('inactive banner is excluded from storefront list', !db.getBanners().some((item) => item._id === banner._id));
check('inactive banner remains in admin list', db.getBanners(true).some((item) => item._id === banner._id));

const reordered = await db.reorderBanners([...db.getBanners(true).map((item) => item._id)].reverse());
check('async banner reorder returns ordered records', reordered.length === defaults.length + 1 && reordered[0].sortOrder === 1);
check('async banner delete removes created record', (await db.deleteBanner(banner._id)) && !db.getBannerById(banner._id));

const imageOnlyBanner = await db.createBanner({ mode: 'image-only', imageUrl, isActive: true });
check('image-only banner defaults are returned', imageOnlyBanner.mode === 'image-only' && imageOnlyBanner.imageUrl === imageUrl);
check('async image-only banner delete succeeds', await db.deleteBanner(imageOnlyBanner._id));

await db.resetDefaultBanners();
check('async banner reset restores five active defaults', db.getBanners(true).length === 5 && db.getBanners(true).every((item) => item.isActive));

const localValues = new Map<string, string>([['retailflow_auth_token', 'test-session-token']]);
const downloads: Array<{ href: string; filename: string; content: string }> = [];
const blobByUrl = new Map<string, Blob>();
const unauthorizedEvents: string[] = [];
const browserGlobal = globalThis as any;
browserGlobal.localStorage = {
  getItem: (key: string) => localValues.get(key) ?? null,
  setItem: (key: string, value: string) => localValues.set(key, value),
  removeItem: (key: string) => localValues.delete(key)
};
browserGlobal.window = {
  dispatchEvent: (event: Event) => { unauthorizedEvents.push(event.type); return true; },
  setTimeout: (callback: () => void) => { callback(); return 1; }
};
browserGlobal.document = {
  body: { appendChild: () => undefined },
  createElement: () => {
    const link: any = {
      style: {}, href: '', download: '',
      click() {
        const blob = blobByUrl.get(this.href);
        if (blob) void blob.text().then((content) => downloads.push({ href: this.href, filename: this.download, content }));
      },
      remove() {}
    };
    return link;
  }
};
let nextObjectUrl = 0;
URL.createObjectURL = ((blob: Blob) => {
  const url = `blob:test-${++nextObjectUrl}`;
  blobByUrl.set(url, blob);
  return url;
}) as typeof URL.createObjectURL;
URL.revokeObjectURL = (() => undefined) as typeof URL.revokeObjectURL;

const originalFetch = globalThis.fetch;
const expectedCsv = 'invoice,total\nINV-1,120.00\n';
let lastRequest: { url: string; authorization: string | null; accept: string | null } | undefined;
globalThis.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  lastRequest = { url: String(input), authorization: headers.get('Authorization'), accept: headers.get('Accept') };
  return new Response(expectedCsv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${String(input).includes('inventory') ? 'inventory_valuation.csv' : 'sales_report.csv'}"`
    }
  });
}) as typeof fetch;

const { api, removeStoredToken, setStoredToken } = await import('../src/api/client.ts');
const exportCases = [
  ['/api/reports/export/sales.csv?startDate=2026-01-01&endDate=2026-01-31', 'sales_report.csv'],
  ['/api/reports/export/inventory.csv', 'inventory_valuation.csv'],
  ['/api/reports/export/sales.csv', 'sales_report.csv']
] as const;
for (const [endpoint, filename] of exportCases) {
  const beforeCount = downloads.length;
  await api.downloadCsv(endpoint, filename);
  await new Promise((resolve) => setTimeout(resolve, 0));
  const downloaded = downloads[beforeCount];
  check(`authenticated CSV download ${endpoint}`, Boolean(
    downloaded && downloaded.filename === filename && downloaded.content === expectedCsv &&
    lastRequest?.url === endpoint && lastRequest.authorization === 'Bearer test-session-token' && lastRequest.accept === 'text/csv'
  ));
}

// Unauthorized responses must trigger the established session flow and never create a file.
globalThis.fetch = (async () => new Response(JSON.stringify({ message: 'Access token is missing. Please log in.' }), {
  status: 401, headers: { 'Content-Type': 'application/json' }
})) as typeof fetch;
const beforeUnauthorized = downloads.length;
let unauthorizedRejected = false;
try { await api.downloadCsv('/api/reports/export/sales.csv', 'sales_report.csv'); } catch { unauthorizedRejected = true; }
check('401 export is rejected and not downloaded', unauthorizedRejected && downloads.length === beforeUnauthorized && unauthorizedEvents.includes('auth:unauthorized'));

setStoredToken('test-session-token');
globalThis.fetch = (async () => new Response(JSON.stringify({ message: 'report failed' }), {
  status: 500, headers: { 'Content-Type': 'application/json' }
})) as typeof fetch;
let serverErrorRejected = false;
try { await api.downloadCsv('/api/reports/export/sales.csv', 'sales_report.csv'); } catch (error) {
  serverErrorRejected = error instanceof Error && error.message === 'report failed';
}
check('server error response is shown and not downloaded', serverErrorRejected && downloads.length === beforeUnauthorized);

removeStoredToken();
const beforeMissingToken = downloads.length;
let missingTokenRejected = false;
try { await api.downloadCsv('/api/reports/export/sales.csv', 'sales_report.csv'); } catch { missingTokenRejected = true; }
check('missing session is rejected before fetch or download', missingTokenRejected && downloads.length === beforeMissingToken);

globalThis.fetch = originalFetch;
const passed = checks.filter((item) => item.passed).length;
console.log(`SUMMARY ${passed}/${checks.length} passed`);
if (passed !== checks.length) process.exitCode = 1;
