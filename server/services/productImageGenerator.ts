/**
 * RetailFlow — Professional Vector Product Illustration Generator
 * 
 * Generates tailored, high-resolution vector SVG illustrations for retail products
 * based on product category and item name keywords.
 * Creates distinctive, high-polish artwork with custom color schemes, realistic
 * packaging silhouettes (burlap sacks, glass jars, oil bottles, canisters, pump dispensers,
 * tech gadgets), verified retail badges, and styled product typography.
 */

export interface ProductArtworkInfo {
  theme: string;
  category: string;
  name: string;
  sku?: string;
}

function escapeXml(unsafe: string): string {
  return (unsafe || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function truncate(str: string, maxLen: number): string {
  if (!str) return '';
  return str.length > maxLen ? str.substring(0, maxLen - 1).trim() + '…' : str;
}

export function generateProductSvg(product: {
  name: string;
  category: string;
  sku?: string;
  sellingPrice?: number;
}): string {
  const name = product.name || 'Retail Product';
  const category = product.category || 'General';
  const sku = product.sku || '';
  const price = product.sellingPrice ? `₹${product.sellingPrice}` : '';

  const lowerName = name.toLowerCase();
  const lowerCat = category.toLowerCase();

  // Helper to detect keywords
  const has = (...keywords: string[]) =>
    keywords.some((k) => lowerName.includes(k) || lowerCat.includes(k));

  // Determine specific item theme
  let theme = 'general';
  if (has('rice', 'basmati', 'grain', 'atta', 'flour', 'wheat', 'quinoa', 'oats')) {
    theme = 'rice_grains';
  } else if (has('dal', 'lentil', 'toor', 'moong', 'chana', 'rajma', 'urad', 'pulse', 'beans')) {
    theme = 'lentils_dal';
  } else if (has('oil', 'ghee', 'mustard', 'olive', 'sunflower', 'canola')) {
    theme = 'oil_ghee';
  } else if (has('tea', 'chai', 'assam', 'green tea', 'herbal tea', 'darjeeling')) {
    theme = 'tea';
  } else if (has('coffee', 'arabica', 'espresso', 'roast', 'brew', 'cafe')) {
    theme = 'coffee';
  } else if (has('spice', 'masala', 'haldi', 'turmeric', 'chilli', 'mirch', 'pepper', 'clove', 'cumin', 'coriander')) {
    theme = 'spices';
  } else if (has('salt', 'sugar', 'namak', 'sweetener', 'jaggery')) {
    theme = 'salt_sugar';
  } else if (has('almond', 'cashew', 'kaju', 'badam', 'walnut', 'raisin', 'pista', 'pistachio', 'dry fruit', 'nuts')) {
    theme = 'nuts_dryfruits';
  } else if (has('biscuit', 'cookie', 'rusk', 'cracker', 'wafer')) {
    theme = 'biscuits';
  } else if (has('chip', 'chips', 'namkeen', 'bhujia', 'snack', 'popcorn', 'crisps')) {
    theme = 'snacks_chips';
  } else if (has('milk', 'dairy', 'cheese', 'butter', 'paneer', 'yogurt', 'curd', 'dahi')) {
    theme = 'dairy_milk';
  } else if (has('juice', 'drink', 'beverage', 'soda', 'cola', 'lemonade', 'water')) {
    theme = 'beverages';
  } else if (has('dishwash', 'detergent', 'cleaner', 'floor', 'soap', 'bleach', 'wash', 'cleaning')) {
    theme = 'household_cleaning';
  } else if (has('shampoo', 'lotion', 'face', 'hygiene', 'cream', 'conditioner', 'body wash')) {
    theme = 'personal_care';
  } else if (has('cable', 'usb', 'charger', 'type-c', 'wire', 'cord', 'adapter')) {
    theme = 'cables';
  } else if (has('powerbank', 'battery', 'portable', 'power bank', 'mah')) {
    theme = 'powerbank';
  } else if (has('earbud', 'headphone', 'audio', 'wireless', 'earphone', 'bluetooth', 'speaker', 'tws', 'anc')) {
    theme = 'audio_earbuds';
  }

  return buildSvgArtwork({ theme, name, category, sku, price });
}

interface SvgParams {
  theme: string;
  name: string;
  category: string;
  sku: string;
  price: string;
}

function buildSvgArtwork({ theme, name, category, sku, price }: SvgParams): string {
  const safeName = escapeXml(truncate(name, 36));
  const safeCat = escapeXml(category.toUpperCase());
  const safeSku = escapeXml(sku);

  let bgTop = '#fcfbf8';
  let bgBottom = '#f4ede2';
  let badgeBg = '#064e3b';
  let badgeText = '#a3e635';
  let mainGraphic = '';

  switch (theme) {
    case 'rice_grains': {
      bgTop = '#fdfbf7';
      bgBottom = '#f3ebe0';
      badgeBg = '#78350f';
      badgeText = '#fde68a';
      mainGraphic = `
        <!-- Burlap / Kraft Grain Sack -->
        <g filter="url(#drop-shadow)">
          <!-- Sack body -->
          <path d="M210 240 C210 210, 390 210, 390 240 L370 470 C370 488, 230 488, 230 470 Z" fill="url(#sack-grad)"/>
          <!-- Stitched top rim -->
          <rect x="220" y="225" width="160" height="22" rx="10" fill="#a16207" stroke="#78350f" stroke-width="2"/>
          <line x1="230" y1="236" x2="370" y2="236" stroke="#fef3c7" stroke-dasharray="4,4" stroke-width="2"/>
          <!-- Kraft Seal Label -->
          <rect x="240" y="280" width="120" height="135" rx="8" fill="#ffffff" opacity="0.94"/>
          <rect x="246" y="286" width="108" height="123" rx="6" fill="none" stroke="#b45309" stroke-width="1.5" stroke-dasharray="3,3"/>
          <!-- Grain stalk icon in label -->
          <path d="M300 310 Q305 325 300 350 Q295 325 300 310 M295 322 Q285 315 292 328 M305 322 Q315 315 308 328 M295 336 Q285 329 292 342 M305 336 Q315 329 308 342" stroke="#b45309" stroke-width="2.5" fill="none" stroke-linecap="round"/>
          <text x="300" y="375" font-family="system-ui, sans-serif" font-size="12" font-weight="800" fill="#78350f" text-anchor="middle">100% PURE GRAIN</text>
          <text x="300" y="395" font-family="system-ui, sans-serif" font-size="10" font-weight="700" fill="#064e3b" text-anchor="middle">PREMIUM AGED</text>
        </g>
        <!-- Spilled grains at base -->
        <ellipse cx="250" cy="475" rx="6" ry="3" fill="#fef08a" transform="rotate(-15 250 475)"/>
        <ellipse cx="265" cy="478" rx="7" ry="3.5" fill="#fef08a" transform="rotate(20 265 478)"/>
        <ellipse cx="335" cy="476" rx="6.5" ry="3" fill="#fef08a" transform="rotate(-30 335 476)"/>
        <ellipse cx="350" cy="474" rx="7" ry="3.5" fill="#fef08a" transform="rotate(10 350 474)"/>
      `;
      break;
    }

    case 'lentils_dal': {
      bgTop = '#fffaf5';
      bgBottom = '#faeee0';
      badgeBg = '#9a3412';
      badgeText = '#ffedd5';
      mainGraphic = `
        <!-- Earthen Terracotta Jar / Stand Pouch with Lentils -->
        <g filter="url(#drop-shadow)">
          <!-- Terracotta Pot -->
          <path d="M225 290 Q200 370 230 460 Q300 480 370 460 Q400 370 375 290 Z" fill="url(#clay-grad)"/>
          <!-- Pot Rim -->
          <ellipse cx="300" cy="290" rx="75" ry="22" fill="#c2410c" stroke="#9a3412" stroke-width="2.5"/>
          <ellipse cx="300" cy="290" rx="63" ry="16" fill="#ea580c"/>
          <!-- Lentils pile on top -->
          <ellipse cx="280" cy="288" rx="8" ry="5" fill="#fdba74"/>
          <ellipse cx="295" cy="286" rx="9" ry="6" fill="#fb923c"/>
          <ellipse cx="312" cy="289" rx="8" ry="5" fill="#fed7aa"/>
          <ellipse cx="325" cy="288" rx="7" ry="5" fill="#f97316"/>
          <!-- Label on pot -->
          <rect x="250" y="340" width="100" height="70" rx="8" fill="#ffffff" opacity="0.95"/>
          <text x="300" y="365" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#9a3412" text-anchor="middle">NATURAL DAL</text>
          <text x="300" y="382" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#65a30d" text-anchor="middle">★ UNPOLISHED ★</text>
          <text x="300" y="398" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#78716c" text-anchor="middle">HIGH PROTEIN</text>
        </g>
      `;
      break;
    }

    case 'oil_ghee': {
      bgTop = '#fefdf5';
      bgBottom = '#fbf3d5';
      badgeBg = '#854d0e';
      badgeText = '#fef08a';
      mainGraphic = `
        <!-- Clear Apothecary Oil Bottle with Golden Liquid -->
        <g filter="url(#drop-shadow)">
          <!-- Bottle Body -->
          <path d="M260 230 L260 270 Q230 300 230 350 L230 460 Q230 475 300 475 Q370 475 370 460 L370 350 Q370 300 340 270 L340 230 Z" fill="#ffffff" stroke="#e2e8f0" stroke-width="3" opacity="0.9"/>
          <!-- Golden Oil Fluid -->
          <path d="M236 345 Q235 465 300 465 Q365 465 364 345 Q330 350 300 345 Q270 340 236 345 Z" fill="url(#oil-grad)"/>
          <!-- Bottle Neck & Cap -->
          <rect x="275" y="195" width="50" height="35" rx="5" fill="#78350f"/>
          <rect x="270" y="225" width="60" height="10" rx="3" fill="#92400e"/>
          <!-- Label -->
          <rect x="250" y="365" width="100" height="75" rx="6" fill="#ffffff" opacity="0.96"/>
          <circle cx="300" cy="388" r="14" fill="#fef08a"/>
          <!-- Droplet icon -->
          <path d="M300 379 Q306 391 300 395 Q294 391 300 379 Z" fill="#ca8a04"/>
          <text x="300" y="416" font-family="system-ui, sans-serif" font-size="10" font-weight="900" fill="#854d0e" text-anchor="middle">COLD PRESSED</text>
          <text x="300" y="430" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#15803d" text-anchor="middle">100% PURE VIRGIN</text>
        </g>
      `;
      break;
    }

    case 'tea': {
      bgTop = '#f4fbf7';
      bgBottom = '#e5f5ec';
      badgeBg = '#064e3b';
      badgeText = '#a3e635';
      mainGraphic = `
        <!-- Metallic / Kraft Tea Tin -->
        <g filter="url(#drop-shadow)">
          <!-- Tin Body -->
          <rect x="230" y="240" width="140" height="230" rx="14" fill="url(#tea-grad)"/>
          <!-- Lid -->
          <rect x="220" y="220" width="160" height="30" rx="8" fill="#022c22" stroke="#047857" stroke-width="2"/>
          <rect x="270" y="208" width="60" height="14" rx="4" fill="#a3e635"/>
          <!-- Gold embossing badge on Tin -->
          <circle cx="300" cy="325" r="38" fill="#022c22" stroke="#facc15" stroke-width="2"/>
          <!-- Tea leaf vector inside badge -->
          <path d="M300 305 Q320 325 300 345 Q280 325 300 305 Z" fill="#4ade80"/>
          <line x1="300" y1="308" x2="300" y2="342" stroke="#022c22" stroke-width="1.5"/>
          <text x="300" y="390" font-family="system-ui, sans-serif" font-size="13" font-weight="900" fill="#facc15" text-anchor="middle">PREMIUM CHAI</text>
          <text x="300" y="408" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#a7f3d0" text-anchor="middle">RICH CTC BLEND</text>
          <text x="300" y="435" font-family="system-ui, sans-serif" font-size="8" font-weight="600" fill="#ffffff" text-anchor="middle" letter-spacing="1">ESTATE PICKED</text>
        </g>
      `;
      break;
    }

    case 'coffee': {
      bgTop = '#faf6f3';
      bgBottom = '#eee3db';
      badgeBg = '#451a03';
      badgeText = '#fed7aa';
      mainGraphic = `
        <!-- Coffee Bag with Roasted Beans -->
        <g filter="url(#drop-shadow)">
          <!-- Kraft Bag -->
          <path d="M225 230 L375 230 L360 470 L240 470 Z" fill="url(#coffee-grad)"/>
          <!-- Folded Top with Brass Clip -->
          <rect x="220" y="215" width="160" height="20" rx="4" fill="#291203"/>
          <rect x="270" y="210" width="60" height="10" rx="3" fill="#d97706"/>
          <!-- Valve circle -->
          <circle cx="300" cy="270" r="10" fill="#1c0c02"/>
          <circle cx="300" cy="270" r="4" fill="#78350f"/>
          <!-- Center Coffee Emblem -->
          <rect x="245" y="300" width="110" height="115" rx="8" fill="#ffffff" opacity="0.96"/>
          <!-- Two roasted coffee beans -->
          <ellipse cx="290" cy="335" rx="14" ry="10" fill="#451a03" transform="rotate(-30 290 335)"/>
          <path d="M282 328 Q290 335 285 344" stroke="#d97706" stroke-width="2" fill="none"/>
          <ellipse cx="312" cy="338" rx="13" ry="9" fill="#5c2606" transform="rotate(25 312 338)"/>
          <path d="M306 332 Q312 338 316 345" stroke="#d97706" stroke-width="1.8" fill="none"/>
          <text x="300" y="375" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#451a03" text-anchor="middle">ARABICA ROAST</text>
          <text x="300" y="395" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#b45309" text-anchor="middle">★ DARK ROAST ★</text>
        </g>
      `;
      break;
    }

    case 'spices': {
      bgTop = '#fef4f4';
      bgBottom = '#fbe3e3';
      badgeBg = '#991b1b';
      badgeText = '#fecaca';
      mainGraphic = `
        <!-- Authentic Spice Container with Red Chili / Star Anise -->
        <g filter="url(#drop-shadow)">
          <!-- Glass Spice Jar -->
          <rect x="235" y="250" width="130" height="215" rx="14" fill="#ffffff" stroke="#fecaca" stroke-width="2" opacity="0.9"/>
          <rect x="240" y="280" width="120" height="175" rx="8" fill="url(#spice-grad)"/>
          <!-- Wooden Lid -->
          <rect x="225" y="225" width="150" height="30" rx="8" fill="#78350f"/>
          <!-- Label -->
          <rect x="250" y="325" width="100" height="85" rx="8" fill="#ffffff" opacity="0.96"/>
          <circle cx="300" cy="355" r="16" fill="#fee2e2"/>
          <!-- Chili Pepper / Sparkle -->
          <path d="M292 362 Q296 346 308 348 Q306 360 292 362 Z" fill="#dc2626"/>
          <path d="M308 348 Q312 344 314 342" stroke="#16a34a" stroke-width="2" fill="none"/>
          <text x="300" y="388" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#991b1b" text-anchor="middle">PURE SPICES</text>
          <text x="300" y="402" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#d97706" text-anchor="middle">AUTHENTIC AROMA</text>
        </g>
      `;
      break;
    }

    case 'dairy_milk': {
      bgTop = '#f3faff';
      bgBottom = '#e2f2fc';
      badgeBg = '#0369a1';
      badgeText = '#bae6fd';
      mainGraphic = `
        <!-- Classic Milk Bottle & Tetra Carton -->
        <g filter="url(#drop-shadow)">
          <!-- Milk Bottle -->
          <path d="M245 220 L245 250 Q225 275 225 320 L225 465 Q225 475 285 475 Q345 475 345 465 L345 320 Q345 275 325 250 L325 220 Z" fill="#ffffff" stroke="#bae6fd" stroke-width="3"/>
          <rect x="250" y="195" width="70" height="28" rx="6" fill="#0284c7"/>
          <rect x="240" y="320" width="90" height="100" rx="6" fill="#e0f2fe"/>
          <!-- Cow silhouette or milk drop -->
          <circle cx="285" cy="355" r="18" fill="#0284c7"/>
          <path d="M285 344 Q291 356 285 362 Q279 356 285 344 Z" fill="#ffffff"/>
          <text x="285" y="385" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#0369a1" text-anchor="middle">FARM FRESH</text>
          <text x="285" y="400" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#0284c7" text-anchor="middle">PASTEURIZED</text>
        </g>
      `;
      break;
    }

    case 'biscuits':
    case 'snacks_chips': {
      bgTop = '#fffaf0';
      bgBottom = '#fcedd5';
      badgeBg = '#c2410c';
      badgeText = '#ffedd5';
      mainGraphic = `
        <!-- Snacking Packet / Biscuit Box -->
        <g filter="url(#drop-shadow)">
          <!-- Pillow pouch / box -->
          <path d="M220 220 L380 220 L370 470 L230 470 Z" fill="url(#snack-grad)"/>
          <!-- Crimped seals -->
          <path d="M220 220 L225 210 L235 220 L245 210 L255 220 L265 210 L275 220 L285 210 L295 220 L305 210 L315 220 L325 210 L335 220 L345 210 L355 220 L365 210 L375 220 L380 220" fill="none" stroke="#ea580c" stroke-width="2"/>
          <path d="M230 470 L235 480 L245 470 L255 480 L265 470 L275 480 L285 470 L295 480 L305 470 L315 480 L325 470 L335 480 L345 470 L355 480 L365 470 L370 470" fill="none" stroke="#ea580c" stroke-width="2"/>
          <!-- Cookie / Snack Vector -->
          <circle cx="300" cy="330" r="42" fill="#d97706" stroke="#92400e" stroke-width="2.5"/>
          <circle cx="285" cy="318" r="3" fill="#78350f"/>
          <circle cx="315" cy="322" r="3.5" fill="#78350f"/>
          <circle cx="295" cy="340" r="3" fill="#78350f"/>
          <circle cx="310" cy="348" r="3" fill="#78350f"/>
          <rect x="250" y="390" width="100" height="40" rx="8" fill="#ffffff" opacity="0.95"/>
          <text x="300" y="415" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#c2410c" text-anchor="middle">CRUNCHY BAKE</text>
        </g>
      `;
      break;
    }

    case 'nuts_dryfruits': {
      bgTop = '#fefcf8';
      bgBottom = '#f4eae0';
      badgeBg = '#78350f';
      badgeText = '#fef3c7';
      mainGraphic = `
        <!-- Stand-up Pouch with Window for Almonds/Cashews -->
        <g filter="url(#drop-shadow)">
          <path d="M225 220 L375 220 L365 470 L235 470 Z" fill="url(#pouch-grad)"/>
          <line x1="225" y1="235" x2="375" y2="235" stroke="#78350f" stroke-width="3"/>
          <!-- Clear Window -->
          <ellipse cx="300" cy="340" rx="50" ry="38" fill="#451a03" stroke="#ffffff" stroke-width="3"/>
          <!-- Almond shapes inside window -->
          <path d="M275 330 Q285 315 295 330 Q285 345 275 330 Z" fill="#d97706"/>
          <path d="M305 328 Q318 318 322 332 Q312 346 305 328 Z" fill="#b45309"/>
          <path d="M290 350 Q305 342 308 356 Q295 365 290 350 Z" fill="#ca8a04"/>
          <rect x="245" y="400" width="110" height="35" rx="6" fill="#ffffff" opacity="0.94"/>
          <text x="300" y="422" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#78350f" text-anchor="middle">100% RAW NUTS</text>
        </g>
      `;
      break;
    }

    case 'household_cleaning': {
      bgTop = '#f0fdfa';
      bgBottom = '#ccfbf1';
      badgeBg = '#0f766e';
      badgeText = '#99f6e4';
      mainGraphic = `
        <!-- Trigger Spray Bottle with Clean Mist Sparkles -->
        <g filter="url(#drop-shadow)">
          <!-- Bottle Body -->
          <path d="M260 250 L260 300 L235 340 L235 465 Q235 475 300 475 Q365 475 365 465 L365 340 L340 300 L340 250 Z" fill="url(#cleaner-grad)"/>
          <!-- Spray Nozzle -->
          <rect x="255" y="215" width="50" height="35" rx="4" fill="#042f2e"/>
          <path d="M305 220 L350 205 L350 230 L305 235 Z" fill="#0d9488"/>
          <!-- Trigger handle -->
          <path d="M255 240 Q235 255 240 280 L255 275" fill="none" stroke="#042f2e" stroke-width="5" stroke-linecap="round"/>
          <!-- Sparkles -->
          <polygon points="365,290 370,280 375,290 385,295 375,300 370,310 365,300 355,295" fill="#facc15"/>
          <polygon points="215,360 220,352 225,360 233,364 225,368 220,376 215,368 207,364" fill="#38bdf8"/>
          <!-- Label -->
          <rect x="250" y="360" width="100" height="70" rx="8" fill="#ffffff" opacity="0.95"/>
          <text x="300" y="388" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#0f766e" text-anchor="middle">BIO CLEAN</text>
          <text x="300" y="405" font-family="system-ui, sans-serif" font-size="9" font-weight="700" fill="#0284c7" text-anchor="middle">★ TOUGH ON DIRT ★</text>
        </g>
      `;
      break;
    }

    case 'cables': {
      bgTop = '#f8fafc';
      bgBottom = '#e2e8f0';
      badgeBg = '#1e3a8a';
      badgeText = '#93c5fd';
      mainGraphic = `
        <!-- High-Tech Braided Nylon Cable with Type-C Tips -->
        <g filter="url(#drop-shadow)">
          <!-- Coiled Braided Cable -->
          <circle cx="300" cy="340" r="95" fill="none" stroke="#1e293b" stroke-width="14" stroke-dasharray="10,4"/>
          <circle cx="300" cy="340" r="75" fill="none" stroke="#3b82f6" stroke-width="12" stroke-dasharray="8,3"/>
          <!-- Center Connector Head -->
          <rect x="270" y="240" width="60" height="70" rx="8" fill="#0f172a"/>
          <!-- Metal Tip -->
          <rect x="280" y="210" width="40" height="30" rx="4" fill="#94a3b8" stroke="#64748b" stroke-width="2"/>
          <!-- Lightning Bolt in Connector -->
          <polygon points="302,255 293,275 301,275 297,295 308,272 300,272" fill="#38bdf8"/>
          <!-- Tech Specs Pill -->
          <rect x="245" y="415" width="110" height="32" rx="16" fill="#1e3a8a"/>
          <text x="300" y="435" font-family="system-ui, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">60W FAST CHARGE</text>
        </g>
      `;
      break;
    }

    case 'powerbank': {
      bgTop = '#f8fafc';
      bgBottom = '#e2e8f0';
      badgeBg = '#0f172a';
      badgeText = '#38bdf8';
      mainGraphic = `
        <!-- Sleek Power Bank with LED Gauge -->
        <g filter="url(#drop-shadow)">
          <rect x="240" y="220" width="120" height="230" rx="18" fill="url(#power-grad)" stroke="#334155" stroke-width="2"/>
          <!-- Port cutouts -->
          <rect x="260" y="235" width="28" height="8" rx="2" fill="#020617"/>
          <rect x="310" y="235" width="28" height="8" rx="2" fill="#020617"/>
          <!-- 4 Battery LEDs -->
          <circle cx="270" cy="270" r="4" fill="#38bdf8"/>
          <circle cx="288" cy="270" r="4" fill="#38bdf8"/>
          <circle cx="306" cy="270" r="4" fill="#38bdf8"/>
          <circle cx="324" cy="270" r="4" fill="#38bdf8"/>
          <!-- Battery icon -->
          <rect x="275" y="320" width="50" height="80" rx="6" fill="none" stroke="#64748b" stroke-width="3"/>
          <rect x="290" y="313" width="20" height="7" rx="2" fill="#64748b"/>
          <polygon points="302,340 293,360 301,360 297,380 308,357 300,357" fill="#22c55e"/>
          <text x="300" y="425" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#94a3b8" text-anchor="middle">10000 mAh</text>
        </g>
      `;
      break;
    }

    case 'audio_earbuds': {
      bgTop = '#fafafa';
      bgBottom = '#e5e7eb';
      badgeBg = '#312e81';
      badgeText = '#c7d2fe';
      mainGraphic = `
        <!-- Sleek TWS Earbuds Pebble Case with Soundwaves -->
        <g filter="url(#drop-shadow)">
          <!-- Soundwave curves in background -->
          <path d="M190 320 Q160 350 190 380" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
          <path d="M410 320 Q440 350 410 380" fill="none" stroke="#cbd5e1" stroke-width="3" stroke-linecap="round"/>
          <!-- Pebble Charging Case -->
          <ellipse cx="300" cy="350" rx="80" ry="60" fill="url(#earbud-grad)" stroke="#1e1b4b" stroke-width="2"/>
          <line x1="220" y1="340" x2="380" y2="340" stroke="#312e81" stroke-width="2"/>
          <!-- LED Indicator -->
          <circle cx="300" cy="365" r="3.5" fill="#22c55e"/>
          <rect x="245" y="425" width="110" height="28" rx="14" fill="#312e81"/>
          <text x="300" y="443" font-family="system-ui, sans-serif" font-size="10" font-weight="900" fill="#ffffff" text-anchor="middle">BLUETOOTH 5.3 ANC</text>
        </g>
      `;
      break;
    }

    default: {
      // General Retail Goods
      bgTop = '#fcfbf8';
      bgBottom = '#f4ede2';
      badgeBg = '#064e3b';
      badgeText = '#a3e635';
      mainGraphic = `
        <!-- Premium Retail Box / Packaging Display -->
        <g filter="url(#drop-shadow)">
          <rect x="220" y="240" width="160" height="220" rx="16" fill="url(#general-grad)"/>
          <rect x="215" y="225" width="170" height="25" rx="6" fill="#042f2e"/>
          <circle cx="300" cy="330" r="36" fill="#064e3b" stroke="#a3e635" stroke-width="2"/>
          <!-- Retail Shopping Bag Icon -->
          <path d="M290 325 L290 345 C290 348 310 348 310 345 L310 325 Z M295 325 C295 318 305 318 305 325" fill="none" stroke="#a3e635" stroke-width="2.5" stroke-linecap="round"/>
          <rect x="245" y="385" width="110" height="40" rx="8" fill="#ffffff" opacity="0.95"/>
          <text x="300" y="405" font-family="system-ui, sans-serif" font-size="11" font-weight="900" fill="#064e3b" text-anchor="middle">VERIFIED RETAIL</text>
          <text x="300" y="418" font-family="system-ui, sans-serif" font-size="8" font-weight="700" fill="#65a30d" text-anchor="middle">AUTHENTIC STOCK</text>
        </g>
      `;
      break;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 600" width="600" height="600">
  <defs>
    <linearGradient id="main-bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${bgTop}"/>
      <stop offset="100%" stop-color="${bgBottom}"/>
    </linearGradient>

    <!-- Drop Shadow Filter -->
    <filter id="drop-shadow" x="-15%" y="-15%" width="130%" height="135%">
      <feDropShadow dx="0" dy="16" stdDeviation="16" flood-color="#0f172a" flood-opacity="0.14"/>
    </filter>

    <!-- Category Specific Gradients -->
    <linearGradient id="sack-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#f5d09b"/>
      <stop offset="100%" stop-color="#c28c46"/>
    </linearGradient>

    <linearGradient id="clay-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>

    <linearGradient id="oil-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#fde047"/>
      <stop offset="100%" stop-color="#ca8a04"/>
    </linearGradient>

    <linearGradient id="tea-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>

    <linearGradient id="coffee-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#78350f"/>
      <stop offset="100%" stop-color="#3b1502"/>
    </linearGradient>

    <linearGradient id="spice-grad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#ef4444"/>
      <stop offset="100%" stop-color="#991b1b"/>
    </linearGradient>

    <linearGradient id="snack-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#fb923c"/>
      <stop offset="100%" stop-color="#c2410c"/>
    </linearGradient>

    <linearGradient id="pouch-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#e6be8a"/>
      <stop offset="100%" stop-color="#a16207"/>
    </linearGradient>

    <linearGradient id="cleaner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2dd4bf"/>
      <stop offset="100%" stop-color="#0f766e"/>
    </linearGradient>

    <linearGradient id="power-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#334155"/>
      <stop offset="100%" stop-color="#0f172a"/>
    </linearGradient>

    <linearGradient id="earbud-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#312e81"/>
      <stop offset="100%" stop-color="#0f0c29"/>
    </linearGradient>

    <linearGradient id="general-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#065f46"/>
      <stop offset="100%" stop-color="#022c22"/>
    </linearGradient>
  </defs>

  <!-- Clean Canvas Background -->
  <rect width="600" height="600" rx="32" fill="url(#main-bg)"/>

  <!-- Top Category Badge Pill -->
  <g transform="translate(300, 52)">
    <rect x="-130" y="-18" width="260" height="36" rx="18" fill="${badgeBg}" filter="url(#drop-shadow)"/>
    <text x="0" y="5" font-family="system-ui, -apple-system, sans-serif" font-size="11" font-weight="800" fill="${badgeText}" text-anchor="middle" letter-spacing="1.2">${safeCat}</text>
  </g>

  <!-- Circular Backdrop Halo -->
  <circle cx="300" cy="340" r="150" fill="#ffffff" opacity="0.65"/>

  <!-- Soft Floor Pedestal Shadow -->
  <ellipse cx="300" cy="485" rx="160" ry="22" fill="#cbd5e1" opacity="0.6"/>
  <ellipse cx="300" cy="485" rx="100" ry="14" fill="#94a3b8" opacity="0.45"/>

  <!-- Main Product Graphic Art -->
  ${mainGraphic}

  <!-- Bottom Informational Bar -->
  <g transform="translate(300, 545)">
    <rect x="-240" y="-22" width="480" height="44" rx="22" fill="#ffffff" opacity="0.96" stroke="#e2e8f0" stroke-width="1.5" filter="url(#drop-shadow)"/>
    <text x="0" y="6" font-family="system-ui, -apple-system, sans-serif" font-size="14" font-weight="800" fill="#0f172a" text-anchor="middle">${safeName}</text>
  </g>

  <!-- Subtle SKU Identifier Top Left -->
  ${safeSku ? `<text x="36" y="44" font-family="monospace" font-size="10" font-weight="600" fill="#94a3b8">${safeSku}</text>` : ''}
  <!-- Subtle Price Badge Top Right -->
  ${price ? `<g transform="translate(520, 42)"><rect x="-42" y="-14" width="84" height="28" rx="8" fill="#ecfdf5" stroke="#a7f3d0" stroke-width="1.5"/><text x="0" y="4" font-family="system-ui, sans-serif" font-size="12" font-weight="900" fill="#064e3b" text-anchor="middle">${price}</text></g>` : ''}
</svg>`;
}
