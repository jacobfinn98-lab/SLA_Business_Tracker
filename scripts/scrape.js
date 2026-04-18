const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sla-business-tracker.glide.page';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'raw_scrape.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

async function extractPageData(page, label) {
  await sleep(2000);
  const data = await page.evaluate(() => {
    const getText = el => (el ? el.innerText.trim() : '');

    // Nav / tab items
    const navItems = [...document.querySelectorAll(
      '[class*="tab"], [class*="nav"], [role="tab"], [class*="menu-item"], [class*="bottom-bar"] a, nav a'
    )].map(el => getText(el)).filter(Boolean);

    // All headings
    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')].map(el => getText(el)).filter(Boolean);

    // Buttons & action labels
    const buttons = [...document.querySelectorAll('button, [role="button"], [class*="btn"]')]
      .map(el => getText(el)).filter(Boolean);

    // Form fields / inputs
    const inputs = [...document.querySelectorAll('input, textarea, select')].map(el => ({
      type: el.type || el.tagName,
      placeholder: el.placeholder || '',
      label: el.labels?.[0]?.innerText || el.getAttribute('aria-label') || el.name || ''
    }));

    // Table / list column headers
    const tableHeaders = [...document.querySelectorAll('th, [class*="column-header"], [class*="list-header"]')]
      .map(el => getText(el)).filter(Boolean);

    // All visible text labels (spans, p, labels, divs with short text)
    const labels = [...document.querySelectorAll('label, [class*="label"], [class*="field-name"], [class*="title"]')]
      .map(el => getText(el)).filter(t => t.length > 0 && t.length < 80);

    // Data chips / badges / status pills
    const chips = [...document.querySelectorAll('[class*="chip"], [class*="badge"], [class*="tag"], [class*="status"], [class*="pill"]')]
      .map(el => getText(el)).filter(Boolean);

    // All links
    const links = [...document.querySelectorAll('a[href]')].map(el => ({
      text: getText(el),
      href: el.getAttribute('href')
    })).filter(l => l.text);

    // Full page text (for entity/value mining)
    const bodyText = document.body.innerText;

    return { navItems, headings, buttons, inputs, tableHeaders, labels, chips, links, bodyText };
  });

  return { screen: label, url: page.url(), ...data };
}

async function clickAndCapture(page, selector, label, results) {
  try {
    const el = await page.$(selector);
    if (el) {
      await el.click();
      await sleep(2500);
      const screenshotPath = path.join(SCREENSHOTS_DIR, `${label.replace(/\W+/g, '_')}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const data = await extractPageData(page, label);
      results.push(data);
      console.log(`  Captured: ${label}`);
    }
  } catch (e) {
    console.log(`  Skipped (error): ${label} — ${e.message}`);
  }
}

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,900']
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36');

  const results = [];

  console.log('Loading app root...');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(8000);

  // Initial screenshot
  await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '00_root.png'), fullPage: true });
  const rootData = await extractPageData(page, 'Root / Home');
  results.push(rootData);
  console.log('  Captured: Root / Home');

  // Discover and click all nav/tab items
  const navSelectors = [
    '[role="tab"]',
    '[class*="tab-bar"] > *',
    '[class*="bottom-nav"] a',
    '[class*="bottom-bar"] a',
    '[class*="sidebar"] a',
    'nav a',
    '[class*="menu"] a',
    '[class*="tab"]:not(input)',
  ];

  const clickedLabels = new Set();

  for (const sel of navSelectors) {
    let items;
    try {
      items = await page.$$(sel);
    } catch { continue; }

    for (let i = 0; i < items.length; i++) {
      let label = '';
      try {
        label = await page.evaluate(el => el.innerText.trim(), items[i]);
      } catch { continue; }
      if (!label || clickedLabels.has(label)) continue;
      clickedLabels.add(label);

      try {
        await items[i].click();
        await sleep(3500);
        const screenshotPath = path.join(SCREENSHOTS_DIR, `nav_${label.replace(/\W+/g, '_')}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        const data = await extractPageData(page, `Nav: ${label}`);
        results.push(data);
        console.log(`  Captured nav: ${label}`);
      } catch (e) {
        console.log(`  Nav click failed: ${label}`);
      }
    }
  }

  // Try clicking list items to see detail views
  const listItemSelectors = [
    '[class*="list-item"]',
    '[class*="row-item"]',
    '[class*="card"]',
    '[class*="tile"]',
  ];

  let detailCount = 0;
  for (const sel of listItemSelectors) {
    if (detailCount >= 5) break;
    let items;
    try { items = await page.$$(sel); } catch { continue; }
    for (let i = 0; i < Math.min(items.length, 3); i++) {
      if (detailCount >= 5) break;
      try {
        const label = await page.evaluate(el => el.innerText.trim().slice(0, 40), items[i]);
        await items[i].click();
        await sleep(2500);
        const screenshotPath = path.join(SCREENSHOTS_DIR, `detail_${detailCount}.png`);
        await page.screenshot({ path: screenshotPath, fullPage: true });
        const data = await extractPageData(page, `Detail view ${detailCount}: ${label}`);
        results.push(data);
        console.log(`  Captured detail: ${label}`);
        detailCount++;
        await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
        await sleep(2000);
      } catch { continue; }
    }
  }

  // Also capture any modal / form by clicking add/new buttons
  const addButtonSelectors = [
    'button[aria-label*="add" i]',
    'button[aria-label*="new" i]',
    '[class*="fab"]',
    'button[class*="add"]',
    'button[class*="create"]',
  ];

  let formCount = 0;
  for (const sel of addButtonSelectors) {
    if (formCount >= 3) break;
    try {
      const btn = await page.$(sel);
      if (!btn) continue;
      await btn.click();
      await sleep(2500);
      const screenshotPath = path.join(SCREENSHOTS_DIR, `form_${formCount}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      const data = await extractPageData(page, `Form/Modal ${formCount}`);
      results.push(data);
      console.log(`  Captured form: Form/Modal ${formCount}`);
      formCount++;
      await page.keyboard.press('Escape');
      await sleep(1000);
    } catch { continue; }
  }

  await browser.close();

  // Deduplicate and clean
  const unique = results.filter((r, i, arr) => arr.findIndex(x => x.screen === r.screen) === i);

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(unique, null, 2));
  console.log(`\nDone. Captured ${unique.length} screens. Output: docs/raw_scrape.json`);
  console.log(`Screenshots: docs/screenshots/`);
})();
