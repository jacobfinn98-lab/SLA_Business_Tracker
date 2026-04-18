const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://sla-business-tracker.glide.page';
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'docs', 'screenshots');
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--window-size=390,844'],
    defaultViewport: { width: 390, height: 844 }
  });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 Mobile/15E148');
  await page.goto(BASE_URL, { waitUntil: 'domcontentloaded', timeout: 90000 });
  await sleep(8000);

  // Find all data-testid tab buttons
  const tabs = await page.evaluate(() => {
    const all = [...document.querySelectorAll('[data-testid]')];
    return all.map(el => ({
      testid: el.getAttribute('data-testid'),
      tag: el.tagName,
      text: (el.innerText || el.textContent || '').trim().slice(0, 50),
      className: el.className.slice(0, 80)
    }));
  });
  console.log('All data-testid elements:');
  console.log(JSON.stringify(tabs, null, 2));

  // Also get all buttons in the tab bar area
  const tabBarBtns = await page.evaluate(() => {
    const tabBar = document.querySelector('[class*="tab-bar"]') || document.querySelector('[aria-label="Tab Navigation"]');
    if (!tabBar) return [];
    return [...tabBar.querySelectorAll('button')].map(el => ({
      text: (el.innerText || el.textContent || '').trim().slice(0, 50),
      testid: el.getAttribute('data-testid'),
      className: el.className.slice(0, 80)
    }));
  });
  console.log('\nTab bar buttons:');
  console.log(JSON.stringify(tabBarBtns, null, 2));

  // Click the last tab bar button (should open side/more menu)
  const allTabBtns = await page.$$('[class*="mobile-tab-bar"] button, [aria-label="Tab Navigation"] button');
  console.log(`\nFound ${allTabBtns.length} tab bar buttons`);

  if (allTabBtns.length > 0) {
    // Click each one and take screenshot
    for (let i = 0; i < allTabBtns.length; i++) {
      try {
        const text = await page.evaluate(e => (e.innerText || e.textContent || '').trim(), allTabBtns[i]);
        await allTabBtns[i].click();
        await sleep(3000);
        await page.screenshot({ path: path.join(SCREENSHOTS_DIR, `tabbar_btn_${i}.png`), fullPage: true });
        const url = page.url();
        const bodyPreview = await page.evaluate(() => document.body.innerText.slice(0, 300));
        console.log(`  Btn ${i} ("${text}") → ${url}`);
        console.log(`  Preview: ${bodyPreview.slice(0, 150).replace(/\n/g, ' ')}`);
      } catch (e) {
        console.log(`  Btn ${i} error: ${e.message}`);
      }
    }
  }

  await browser.close();
})();
