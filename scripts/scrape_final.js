const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sla-business-tracker.glide.page';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const OUTPUT_FILE = path.join(__dirname, '..', 'docs', 'raw_scrape.json');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// Bottom tab bar tabs (have data-testid)
const BOTTOM_TABS = ['Dashboard', 'Activity', 'Business', 'Rolodex'];
// Side menu overflow tabs (in mobile-sidemenu)
const SIDE_TABS = ['BPM Guests', 'Teams', 'Providers'];

async function extractPageData(page, label) {
  await sleep(2500);
  return await page.evaluate((screenLabel) => {
    const getText = el => (el ? (el.innerText || el.textContent || '').trim() : '');

    const headings = [...document.querySelectorAll('h1,h2,h3,h4,h5,h6')]
      .map(el => getText(el)).filter(t => t && t.length < 300);

    const buttons = [...document.querySelectorAll('button,[role="button"]')]
      .map(el => getText(el)).filter(Boolean);

    const inputs = [...document.querySelectorAll('input,textarea,select')].map(el => ({
      type: el.type || el.tagName.toLowerCase(),
      placeholder: el.placeholder || '',
      label: (el.labels?.[0] ? getText(el.labels[0]) : '') || el.getAttribute('aria-label') || el.name || ''
    }));

    const tableHeaders = [...document.querySelectorAll('th')]
      .map(el => getText(el)).filter(Boolean);

    const chips = [...document.querySelectorAll('[class*="chip"],[class*="badge"],[class*="tag"],[class*="pill"]')]
      .map(el => getText(el)).filter(Boolean);

    // Glide-specific list items
    const listItems = [...document.querySelectorAll('[class*="list-item"],[class*="card-item"],[class*="row-item"]')]
      .map(el => getText(el)).filter(t => t && t.length < 300).slice(0, 20);

    // Column names (Glide uses specific grid classes)
    const columns = [...document.querySelectorAll('[class*="column"],[class*="grid-col"]')]
      .map(el => getText(el)).filter(t => t && t.length < 100).slice(0, 30);

    const bodyText = document.body ? getText(document.body) : '';

    return {
      screen: screenLabel,
      url: window.location.href,
      headings,
      buttons,
      inputs,
      tableHeaders,
      chips,
      listItems,
      columns,
      bodyText
    };
  }, label);
}

async function openSideMenu(page) {
  // Click the hamburger/more button to open the side menu
  try {
    // Look for the "more" button in the bottom tab bar
    const moreBtn = await page.$('[data-testid="tab-more"], [class*="more-button"], [aria-label*="more" i], [aria-label*="menu" i]');
    if (moreBtn) {
      await moreBtn.click();
      await sleep(1500);
      return true;
    }
    // Try clicking the last button in the tab bar (usually "More")
    const tabButtons = await page.$$('[class*="mobile-tab-bar"] button');
    if (tabButtons.length > 0) {
      const last = tabButtons[tabButtons.length - 1];
      await last.click();
      await sleep(1500);
      return true;
    }
  } catch { }
  return false;
}

async function clickSideMenuTab(page, tabName) {
  await openSideMenu(page);
  // Find the button in the side menu
  const sideBtns = await page.$$('[class*="mobile-sidemenu"] button, [class*="sidemenu"] button');
  for (const btn of sideBtns) {
    const text = await page.evaluate(e => (e.innerText || e.textContent || '').trim(), btn);
    if (text === tabName || text.includes(tabName)) {
      await btn.click();
      await sleep(3000);
      return true;
    }
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

  // --- BOTTOM TABS ---
  for (const tabName of BOTTOM_TABS) {
    try {
      const btn = await page.$(`[data-testid="tab-${tabName}"]`);
      if (!btn) {
        console.log(`  Tab button not found: ${tabName}`);
        continue;
      }
      await btn.click();
      await sleep(3500);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `tab_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
      const data = await extractPageData(page, tabName);
      results.push(data);
      console.log(`  Captured: ${tabName}`);

      // Try clicking first content item for detail
      const contentSelectors = [
        '[class*="list-item"]', '[class*="card"]', '[class*="wire-container"] [class*="row"]',
        '[class*="collection"] > *', '[class*="list"] > *'
      ];
      let detailCaptured = false;
      for (const sel of contentSelectors) {
        if (detailCaptured) break;
        try {
          const items = await page.$$(sel);
          // Skip nav items
          const contentItems = [];
          for (const item of items) {
            const text = await page.evaluate(e => (e.innerText || '').trim(), item);
            if (text && text.length > 5 && !['Dashboard', 'Activity', 'Business', 'Rolodex', 'BPM Guests', 'Teams', 'Providers'].includes(text)) {
              contentItems.push(item);
            }
          }
          if (contentItems.length > 0) {
            const itemText = await page.evaluate(e => (e.innerText || '').trim().slice(0, 60), contentItems[0]);
            await contentItems[0].click();
            await sleep(2500);
            const detailUrl = page.url();
            if (detailUrl !== page.url()) { // navigated somewhere
              await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `detail_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
              const detail = await extractPageData(page, `${tabName} - Detail`);
              results.push(detail);
              console.log(`    Detail: ${itemText.slice(0, 40)}`);
              detailCaptured = true;
              await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
              await sleep(2000);
            }
          }
        } catch { continue; }
      }

      // Check for + / FAB button
      try {
        const fab = await page.$('[class*="fab"], [aria-label*="add" i], button[class*="add"]');
        if (fab) {
          await fab.click();
          await sleep(2500);
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `form_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
          const form = await extractPageData(page, `${tabName} - Add Form`);
          results.push(form);
          console.log(`    Form captured for: ${tabName}`);
          await page.keyboard.press('Escape');
          await sleep(1000);
        }
      } catch { }

    } catch (e) {
      console.log(`  Error on tab ${tabName}: ${e.message}`);
    }
  }

  // --- SIDE MENU TABS ---
  for (const tabName of SIDE_TABS) {
    try {
      const success = await clickSideMenuTab(page, tabName);
      if (!success) {
        console.log(`  Side menu tab not found: ${tabName}`);
        continue;
      }
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `tab_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
      const data = await extractPageData(page, tabName);
      results.push(data);
      console.log(`  Captured (side menu): ${tabName}`);

      // Try detail view
      const contentSelectors = ['[class*="list-item"]', '[class*="card"]', '[class*="collection"] > *'];
      for (const sel of contentSelectors) {
        try {
          const items = await page.$$(sel);
          const valid = [];
          for (const item of items) {
            const text = await page.evaluate(e => (e.innerText || '').trim(), item);
            if (text && text.length > 5 && !BOTTOM_TABS.concat(SIDE_TABS).includes(text)) {
              valid.push(item);
            }
          }
          if (valid.length > 0) {
            const itemText = await page.evaluate(e => (e.innerText || '').trim().slice(0, 60), valid[0]);
            await valid[0].click();
            await sleep(2500);
            await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `detail_${tabName.replace(/\W+/g, '_')}.png`), fullPage: true });
            const detail = await extractPageData(page, `${tabName} - Detail`);
            results.push(detail);
            console.log(`    Detail: ${itemText.slice(0, 40)}`);
            await page.goBack({ waitUntil: 'domcontentloaded' }).catch(() => {});
            await sleep(2000);
            break;
          }
        } catch { continue; }
      }
    } catch (e) {
      console.log(`  Error on side tab ${tabName}: ${e.message}`);
    }
  }

  // --- QUICK ADD BUTTONS (Contact, Guest, Appt, Recruit, Biz) ---
  console.log('\nCapturing quick-add forms...');
  // Go back to Dashboard first
  try {
    const dashBtn = await page.$('[data-testid="tab-Dashboard"]');
    if (dashBtn) { await dashBtn.click(); await sleep(3000); }
  } catch { }

  const quickAddLabels = ['Contact', 'Guest', 'Appt', 'Recruit', 'Biz'];
  for (const label of quickAddLabels) {
    try {
      const allBtns = await page.$$('button,[role="button"]');
      for (const btn of allBtns) {
        const text = await page.evaluate(e => (e.innerText || '').trim(), btn);
        if (text === label) {
          await btn.click();
          await sleep(2500);
          await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `quickadd_${label}.png`), fullPage: true });
          const form = await extractPageData(page, `Quick Add - ${label}`);
          results.push(form);
          console.log(`  Captured quick-add: ${label}`);
          await page.keyboard.press('Escape');
          await sleep(1000);
          break;
        }
      }
    } catch (e) {
      console.log(`  Quick-add error (${label}): ${e.message}`);
    }
  }

  await browser.close();

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(results, null, 2));
  console.log(`\nDone. Captured ${results.length} screens.`);
  console.log(`Output: docs/raw_scrape.json`);
})();
