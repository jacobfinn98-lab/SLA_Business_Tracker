const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sla-business-tracker.glide.page';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'raw_scrape.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Known tab routes discovered via DOM inspection
const TAB_ROUTES = {
  Dashboard: '/dl/a400f7',
  Activity:  '/dl/da19fa',
  Business:  '/dl/6471c6',
  Rolodex:   '/dl/bdae2a',
};

async function extractAll(page, label) {
  await sleep(2500);
  return await page.evaluate((screenLabel) => {
    const getText = el => (el ? (el.innerText || el.textContent || '').trim() : '');

    // All big-number KPI cards
    const kpiCards = [...document.querySelectorAll('[data-testid="big-numbers-card"]')]
      .map(el => getText(el));

    // All collection items
    const collectionItems = [...document.querySelectorAll('[data-testid^="collection-item"]')]
      .map(el => getText(el));

    // All wire-text headings
    const wireTexts = [...document.querySelectorAll('[data-testid="wire-text"]')]
      .map(el => getText(el)).filter(Boolean);

    // Buttons
    const buttons = [...document.querySelectorAll('button,[role="button"],[data-testid="wbb-button"]')]
      .map(el => getText(el)).filter(t => t && t.length < 100);

    // Inputs / form fields
    const inputs = [...document.querySelectorAll('input,textarea,select,\
      [class*="input"],[class*="field"],[class*="picker"]')].map(el => ({
      type: el.type || el.tagName.toLowerCase(),
      placeholder: el.placeholder || '',
      ariaLabel: el.getAttribute('aria-label') || '',
      name: el.name || el.id || '',
      label: el.labels && el.labels[0] ? getText(el.labels[0]) : ''
    })).filter(i => i.placeholder || i.ariaLabel || i.name || i.label);

    // Section headings from wire containers
    const sections = [...document.querySelectorAll('[data-testid="wire-container"]')]
      .map(el => getText(el)).filter(t => t && t.length < 120 && t.length > 3);

    const bodyText = document.body ? getText(document.body) : '';

    return {
      screen: screenLabel,
      url: window.location.href,
      kpiCards,
      collectionItems,
      wireTexts,
      buttons: [...new Set(buttons)],
      inputs,
      sections: [...new Set(sections)].slice(0, 30),
      bodyText
    };
  }, label);
}

async function scrapeTab(page, tabName, url, results) {
  console.log(`\nScraping: ${tabName}`);
  await page.goto(BASE_URL + url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(5000);
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `tab_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
  const data = await extractAll(page, tabName);
  results.push(data);
  console.log(`  ✓ Main screen`);

  // Click first collection item for detail view
  const items = await page.$$('[data-testid^="collection-item"]');
  if (items.length > 0) {
    try {
      await items[0].click();
      await sleep(3000);
      const newUrl = page.url();
      if (newUrl !== BASE_URL + url) {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `detail_${tabName.replace(/\W+/g, '_')}_0.png`), fullPage: true });
        const detail = await extractAll(page, `${tabName} - Detail`);
        results.push(detail);
        console.log(`  ✓ Detail view`);
        await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
        await sleep(2000);
      }
    } catch { }
  }

  // Click second item too for more field coverage
  const items2 = await page.$$('[data-testid^="collection-item"]');
  if (items2.length > 1) {
    try {
      await items2[1].click();
      await sleep(3000);
      const newUrl = page.url();
      if (newUrl !== BASE_URL + url) {
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `detail_${tabName.replace(/\W+/g, '_')}_1.png`), fullPage: true });
        const detail = await extractAll(page, `${tabName} - Detail 2`);
        results.push(detail);
        console.log(`  ✓ Detail view 2`);
        await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
        await sleep(2000);
      }
    } catch { }
  }
}

async function scrapeTabBySideMenu(page, tabName, results) {
  console.log(`\nScraping (side menu): ${tabName}`);
  // Open the hamburger / side menu
  const menuBtn = await page.$('[data-testid="menu-left-button"]');
  if (menuBtn) {
    await menuBtn.click();
    await sleep(2000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `sidemenu_open.png`), fullPage: false });
  }

  // Click the matching side menu button
  const sideBtns = await page.$$('[class*="mobile-sidemenu"] button');
  let clicked = false;
  for (const btn of sideBtns) {
    const text = await page.evaluate(e => (e.innerText || e.textContent || '').trim(), btn);
    if (text.includes(tabName)) {
      await btn.click();
      await sleep(3500);
      clicked = true;
      break;
    }
  }

  if (!clicked) {
    console.log(`  ✗ Could not find side menu button for: ${tabName}`);
    return;
  }

  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `tab_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
  const data = await extractAll(page, tabName);
  results.push(data);
  console.log(`  ✓ Main screen`);

  // Try detail
  const items = await page.$$('[data-testid^="collection-item"]');
  if (items.length > 0) {
    try {
      await items[0].click();
      await sleep(3000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `detail_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
      const detail = await extractAll(page, `${tabName} - Detail`);
      results.push(detail);
      console.log(`  ✓ Detail view`);
      await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
      await sleep(2000);
    } catch { }
  }
}

async function scrapeQuickAddForms(page, results) {
  console.log('\nScraping quick-add forms...');
  await page.goto(BASE_URL + TAB_ROUTES.Dashboard, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await sleep(5000);

  const quickAddBtns = ['Contact', 'Guest', 'Appt', 'Recruit', 'Biz'];
  for (const label of quickAddBtns) {
    try {
      const btns = await page.$$('[data-testid="wbb-button"]');
      let found = false;
      for (const btn of btns) {
        const text = await page.evaluate(e => (e.innerText || '').trim(), btn);
        if (text === label) {
          await btn.click();
          await sleep(3000);
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `form_${label}.png`), fullPage: true });
          const form = await extractAll(page, `Form - ${label}`);
          results.push(form);
          console.log(`  ✓ Form: ${label}`);
          found = true;
          // Close form
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
      if (!found) console.log(`  ✗ Button not found: ${label}`);
    } catch (e) {
      console.log(`  Error on ${label}: ${e.message}`);
    }
  }
}

(async () => {
  console.log('=== SLA Business Tracker — Full Scrape ===');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=390,844'],
    defaultViewport: { width: 390, height: 844 }
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1');

  const results = [];

  // Load app first
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(8000);

  // Scrape all known-route tabs
  for (const [tabName, route] of Object.entries(TAB_ROUTES)) {
    await scrapeTab(page, tabName, route, results);
  }

  // Scrape side menu tabs
  for (const tabName of ['BPM Guests', 'Teams', 'Providers']) {
    await page.goto(BASE_URL + TAB_ROUTES.Dashboard, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await sleep(4000);
    await scrapeTabBySideMenu(page, tabName, results);
  }

  // Scrape quick-add forms
  await scrapeQuickAddForms(page, results);

  await browser.close();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\n=== Done. ${results.length} screens captured ===`);
  console.log(`Output: docs/raw_scrape.json`);
})();
