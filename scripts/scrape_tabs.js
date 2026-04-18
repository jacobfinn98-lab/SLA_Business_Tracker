const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sla-business-tracker.glide.page';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'raw_scrape.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

const TAB_NAMES = ['Dashboard', 'Activity', 'Business', 'Rolodex', 'BPM Guests', 'Teams', 'Providers'];

async function extractPageData(page, label) {
  const data = await page.evaluate(() => {
    const getText = el => (el ? (el.innerText || el.textContent || '').trim() : '');

    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6,[class*="title"],[class*="heading"]')]
      .map(el => getText(el)).filter(t => t && t.length < 200);

    const buttons = [...document.querySelectorAll('button,[role="button"],[class*="btn"]')]
      .map(el => getText(el)).filter(Boolean);

    const inputs = [...document.querySelectorAll('input,textarea,select')].map(el => ({
      type: el.type || el.tagName,
      placeholder: el.placeholder || '',
      label: (el.labels?.[0] ? getText(el.labels[0]) : '') || el.getAttribute('aria-label') || el.name || el.id || ''
    }));

    const tableHeaders = [...document.querySelectorAll('th,[class*="column-header"],[class*="grid-header"]')]
      .map(el => getText(el)).filter(Boolean);

    const chips = [...document.querySelectorAll('[class*="chip"],[class*="badge"],[class*="tag"],[class*="status"],[class*="pill"]')]
      .map(el => getText(el)).filter(Boolean);

    // Extract all meaningful text blocks (sections, cards, list items)
    const contentBlocks = [...document.querySelectorAll('[class*="section"],[class*="card"],[class*="list-item"],[class*="row"],[class*="cell"],[class*="item"]')]
      .map(el => getText(el)).filter(t => t && t.length > 3 && t.length < 500)
      .slice(0, 50);

    // All short text nodes as potential field labels
    const allText = document.body ? getText(document.body) : '';

    return { headings, buttons, inputs, tableHeaders, chips, contentBlocks, bodyText: allText };
  });

  return { screen: label, url: page.url(), ...data };
}

async function clickTabByText(page, tabText) {
  // Try multiple selector strategies for Glide nav buttons
  const strategies = [
    // Exact button text
    `button`,
    `[role="tab"]`,
    `[role="button"]`,
    `[class*="tab"]`,
    `[class*="nav"] *`,
    `[class*="menu"] *`,
    `a`,
  ];

  for (const sel of strategies) {
    try {
      const els = await page.$$(sel);
      for (const el of els) {
        const text = await page.evaluate(e => (e.innerText || e.textContent || '').trim(), el);
        if (text === tabText || text.startsWith(tabText)) {
          await el.click();
          await sleep(3500);
          return true;
        }
      }
    } catch { continue; }
  }
  return false;
}

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=390,844'],
    defaultViewport: { width: 390, height: 844 }
  });

  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148 Safari/604.1');

  const results = [];

  console.log('Loading app...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(8000);

  // Root screenshot
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '00_root.png'), fullPage: true });
  const rootData = await extractPageData(page, 'Dashboard');
  results.push(rootData);
  console.log('  Captured: Dashboard (root)');

  // Navigate each tab
  for (const tabName of TAB_NAMES.slice(1)) {
    console.log(`  Navigating to: ${tabName}`);
    const success = await clickTabByText(page, tabName);
    if (success) {
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `tab_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
      const data = await extractPageData(page, tabName);
      results.push(data);
      console.log(`  Captured: ${tabName}`);

      // Try clicking first list item for detail view
      const listSelectors = ['[class*="list-item"]', '[class*="card"]', '[class*="row"]:not([class*="header"])'];
      for (const sel of listSelectors) {
        try {
          const items = await page.$$(sel);
          if (items.length > 0) {
            const label = await page.evaluate(e => (e.innerText || '').trim().slice(0, 40), items[0]);
            await items[0].click();
            await sleep(2500);
            const ssPath = path.join(SCREENSHOTS_DIR, `detail_${tabName.replace(/\W+/g, '_')}.png`);
            await page.screenshot({ path: ssPath, fullPage: true });
            const detail = await extractPageData(page, `${tabName} - Detail`);
            results.push(detail);
            console.log(`  Captured detail for: ${tabName} (${label})`);
            await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
            await sleep(2000);
            break;
          }
        } catch { continue; }
      }

      // Check for FAB / add button
      const addSelectors = ['button[aria-label*="add" i]', '[class*="fab"]', 'button[class*="add"]', 'button:last-child'];
      for (const sel of addSelectors) {
        try {
          const btn = await page.$(sel);
          if (btn) {
            const btnText = await page.evaluate(e => (e.innerText || '').toLowerCase(), btn);
            if (btnText.includes('add') || btnText.includes('new') || btnText === '+' || btnText === '') {
              await btn.click();
              await sleep(2500);
              const ssPath = path.join(SCREENSHOTS_DIR, `form_${tabName.replace(/\W+/g, '_')}.png`);
              await page.screenshot({ path: ssPath, fullPage: true });
              const form = await extractPageData(page, `${tabName} - Add Form`);
              results.push(form);
              console.log(`  Captured add form for: ${tabName}`);
              await page.keyboard.press('Escape');
              await sleep(1000);
              break;
            }
          }
        } catch { continue; }
      }

      // Go back to dashboard before next tab
      const backSuccess = await clickTabByText(page, 'Dashboard');
      if (!backSuccess) {
        await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await sleep(4000);
      }
      // Now navigate to the target tab again (we went to dashboard, we need to retry)
      // Actually, let's just navigate directly
      await clickTabByText(page, tabName);
      await sleep(1000);
    } else {
      console.log(`  Failed to navigate to: ${tabName}`);
    }
  }

  await browser.close();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nDone. Captured ${results.length} screens. Output: docs/raw_scrape.json`);
})();
