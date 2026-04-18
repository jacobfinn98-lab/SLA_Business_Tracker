const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sla-business-tracker.glide.page';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots_desktop');
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'raw_scrape_desktop.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Confirmed tab routes from prior DOM inspection
const TAB_ROUTES = {
  Dashboard: '/dl/a400f7',
  Activity:  '/dl/da19fa',
  Business:  '/dl/6471c6',
  Rolodex:   '/dl/bdae2a',
};
const SIDE_TABS = ['BPM Guests', 'Teams', 'Providers'];

// Desktop viewport — 1440 wide is the standard design breakpoint for admin dashboards
const VIEWPORT = { width: 1440, height: 900 };

async function extractAll(page, label) {
  await sleep(2500);
  return await page.evaluate((screenLabel) => {
    const getText = el => (el ? (el.innerText || el.textContent || '').trim() : '');

    const kpiCards = [...document.querySelectorAll('[data-testid="big-numbers-card"]')]
      .map(el => getText(el));

    const collectionItems = [...document.querySelectorAll('[data-testid^="collection-item"]')]
      .map(el => getText(el));

    const wireTexts = [...document.querySelectorAll('[data-testid="wire-text"]')]
      .map(el => getText(el)).filter(Boolean);

    const buttons = [...document.querySelectorAll('button,[role="button"],[data-testid="wbb-button"]')]
      .map(el => getText(el)).filter(t => t && t.length < 100);

    const inputs = [...document.querySelectorAll('input,textarea,select')].map(el => ({
      type: el.type || el.tagName.toLowerCase(),
      placeholder: el.placeholder || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      name: el.name || el.id || '',
      label: el.labels && el.labels[0] ? getText(el.labels[0]) : ''
    })).filter(i => i.placeholder || i.ariaLabel || i.name || i.label);

    const tableHeaders = [...document.querySelectorAll('th,[class*="column-header"]')]
      .map(el => getText(el)).filter(Boolean);

    const sections = [...document.querySelectorAll('[data-testid="wire-container"]')]
      .map(el => getText(el)).filter(t => t && t.length < 120 && t.length > 3);

    // Desktop: capture sidebar nav if visible
    const sidebarItems = [...document.querySelectorAll('[class*="sidebar"] a, [class*="side-bar"] button, [class*="unified-side-bar"] button')]
      .map(el => getText(el)).filter(Boolean);

    const bodyText = document.body ? getText(document.body) : '';

    return {
      screen: screenLabel,
      url: window.location.href,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      kpiCards,
      collectionItems,
      wireTexts,
      buttons: [...new Set(buttons)],
      inputs,
      tableHeaders,
      sections: [...new Set(sections)].slice(0, 40),
      sidebarItems: [...new Set(sidebarItems)],
      bodyText
    };
  }, label);
}

async function scrapeTab(page, tabName, route, results) {
  console.log(`\nScraping: ${tabName}`);
  await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(5000);

  await page.screenshot({
    path: path.join(SCREENSHOTS_DIR, `tab_${tabName.replace(/\W+/g, '_')}.png`),
    fullPage: true
  });
  const data = await extractAll(page, tabName);
  results.push(data);
  console.log(`  ✓ Main screen  [${data.viewport.width}x${data.viewport.height}]`);

  // Click first collection item for detail
  const items = await page.$$('[data-testid^="collection-item"]');
  if (items.length > 0) {
    try {
      await items[0].click();
      await sleep(3000);
      if (page.url() !== BASE_URL + route) {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `detail_${tabName.replace(/\W+/g, '_')}_0.png`), fullPage: true });
        results.push(await extractAll(page, `${tabName} - Detail`));
        console.log(`  ✓ Detail view`);
        await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
        await sleep(2000);
      }
    } catch { }
  }

  // Click second item
  const items2 = await page.$$('[data-testid^="collection-item"]');
  if (items2.length > 1) {
    try {
      await items2[1].click();
      await sleep(3000);
      if (page.url() !== BASE_URL + route) {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `detail_${tabName.replace(/\W+/g, '_')}_1.png`), fullPage: true });
        results.push(await extractAll(page, `${tabName} - Detail 2`));
        console.log(`  ✓ Detail view 2`);
        await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
        await sleep(2000);
      }
    } catch { }
  }
}

async function clickByText(page, text) {
  // Try every button/anchor on the page for an exact or partial text match
  const selectors = [
    '[class*="sidemenu"] button',
    '[class*="unified-side-bar"] button',
    '[class*="sidebar"] button',
    '[class*="sidebar"] a',
    'button',
    'a',
  ];
  for (const sel of selectors) {
    try {
      const els = await page.$$(sel);
      for (const el of els) {
        const t = await page.evaluate(e => (e.innerText || e.textContent || '').trim(), el).catch(() => '');
        if (t === text || t.includes(text)) {
          // Check element is visible before clicking
          const visible = await page.evaluate(e => {
            const r = e.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
          }, el).catch(() => false);
          if (visible) {
            await el.click();
            return true;
          }
        }
      }
    } catch { continue; }
  }
  return false;
}

async function scrapeTabBySideMenu(page, tabName, results) {
  console.log(`\nScraping (side menu): ${tabName}`);

  // On desktop Glide may show a persistent sidebar — try clicking directly first
  let clicked = await clickByText(page, tabName);

  if (!clicked) {
    // Try opening the hamburger menu first, then click
    try {
      const menuBtn = await page.$('[data-testid="menu-left-button"]');
      if (menuBtn) {
        const visible = await page.evaluate(e => {
          const r = e.getBoundingClientRect();
          return r.width > 0 && r.height > 0;
        }, menuBtn).catch(() => false);
        if (visible) { await menuBtn.click(); await sleep(2000); }
      }
    } catch { }
    clicked = await clickByText(page, tabName);
  }

  if (!clicked) { console.log(`  ✗ Could not click: ${tabName}`); return; }

  await sleep(3500);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `tab_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
  results.push(await extractAll(page, tabName));
  console.log(`  ✓ Main screen`);

  // Try detail
  try {
    const items = await page.$$('[data-testid^="collection-item"]');
    if (items.length > 0) {
      await items[0].click();
      await sleep(3000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `detail_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
      results.push(await extractAll(page, `${tabName} - Detail`));
      console.log(`  ✓ Detail view`);
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await sleep(2000);
    }
  } catch { }
}

async function scrapeQuickAddForms(page, results) {
  console.log('\nScraping quick-add forms...');
  await page.goto(BASE_URL + TAB_ROUTES.Dashboard, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(5000);

  const quickAddLabels = ['Contact', 'Guest', 'Appt', 'Recruit', 'Biz'];
  for (const label of quickAddLabels) {
    try {
      const btns = await page.$$('[data-testid="wbb-button"]');
      for (const btn of btns) {
        const text = await page.evaluate(e => (e.innerText || '').trim(), btn);
        if (text === label) {
          await btn.click();
          await sleep(3000);
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `form_${label}.png`), fullPage: true });
          results.push(await extractAll(page, `Form - ${label}`));
          console.log(`  ✓ Form: ${label}`);
          try {
            await page.keyboard.press('Escape');
            await sleep(800);
            const cancelBtns = await page.$$('button');
            for (const cb of cancelBtns) {
              const t = await page.evaluate(e => (e.innerText || '').trim(), cb);
              if (t === 'Cancel' || t === 'Close') { await cb.click(); break; }
            }
          } catch { }
          await sleep(1000);
          break;
        }
      }
    } catch (e) {
      console.log(`  Error on ${label}: ${e.message}`);
    }
  }
}

async function captureResponsiveBreakpoints(page, tabName, route) {
  // Capture the same page at common responsive breakpoints
  const breakpoints = [
    { label: '1440', width: 1440, height: 900 },
    { label: '1280', width: 1280, height: 800 },
    { label: '768',  width: 768,  height: 1024 },
    { label: '390',  width: 390,  height: 844 },
  ];
  console.log(`\n  Responsive breakpoints for: ${tabName}`);
  for (const bp of breakpoints) {
    await page.setViewport({ width: bp.width, height: bp.height });
    await sleep(1500);
    await page.screenshot({
      path: path.join(SCREENSHOTS_DIR, `responsive_${tabName.replace(/\W+/g, '_')}_${bp.label}.png`),
      fullPage: false  // viewport-height only — shows actual responsive render
    });
    console.log(`    ${bp.label}px captured`);
  }
  // Reset to desktop
  await page.setViewport(VIEWPORT);
  await sleep(500);
}

(async () => {
  console.log('=== SLA Business Tracker — Desktop Scrape ===');
  console.log(`Primary viewport: ${VIEWPORT.width}x${VIEWPORT.height}`);

  if (!fs.existsSync(SCREENSHOTS_DIR)) fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', `--window-size=${VIEWPORT.width},${VIEWPORT.height}`],
    defaultViewport: VIEWPORT
  });
  const page = await browser.newPage();
  // Desktop user agent — Chrome on Windows
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');

  const results = [];

  // Initial load
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(8000);

  // Scrape all bottom-nav tabs at desktop
  for (const [tabName, route] of Object.entries(TAB_ROUTES)) {
    await scrapeTab(page, tabName, route, results);
  }

  // Scrape side-menu tabs
  for (const tabName of SIDE_TABS) {
    await page.goto(BASE_URL + TAB_ROUTES.Dashboard, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(4000);
    await scrapeTabBySideMenu(page, tabName, results);
  }

  // Quick-add forms
  await scrapeQuickAddForms(page, results);

  // Responsive breakpoint capture for key screens
  for (const [tabName, route] of Object.entries(TAB_ROUTES)) {
    await page.goto(BASE_URL + route, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(3000);
    await captureResponsiveBreakpoints(page, tabName, route);
  }

  await browser.close();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\n=== Done. ${results.length} screens captured ===`);
  console.log(`Primary screenshots: docs/screenshots_desktop/`);
  console.log(`Responsive breakpoints: docs/screenshots_desktop/responsive_*.png`);
  console.log(`Output data: docs/raw_scrape_desktop.json`);
})();
