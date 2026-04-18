const puppeteer = require('puppeteer');

const BASE_URL = 'https://sla-business-tracker.glide.page';
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

  // Dump the full HTML of nav-related elements
  const navInfo = await page.evaluate(() => {
    // Find elements containing tab text
    const tabTexts = ['Activity', 'Business', 'Rolodex', 'BPM Guests', 'Teams', 'Providers'];
    const results = [];

    // Search ALL elements
    const all = document.querySelectorAll('*');
    for (const el of all) {
      const text = (el.innerText || el.textContent || '').trim();
      for (const tab of tabTexts) {
        if (text === tab) {
          results.push({
            tag: el.tagName,
            className: el.className,
            id: el.id,
            role: el.getAttribute('role'),
            ariaLabel: el.getAttribute('aria-label'),
            text: text,
            outerHTMLSnippet: el.outerHTML.slice(0, 200),
            parentClass: el.parentElement ? el.parentElement.className : '',
            parentTag: el.parentElement ? el.parentElement.tagName : '',
          });
        }
      }
    }
    return results;
  });

  console.log('Nav elements found:');
  console.log(JSON.stringify(navInfo, null, 2));

  // Also dump the bottom nav area HTML
  const bottomNav = await page.evaluate(() => {
    // Look for bottom navigation container
    const candidates = [
      ...document.querySelectorAll('[class*="bottom"]'),
      ...document.querySelectorAll('[class*="tab-bar"]'),
      ...document.querySelectorAll('[class*="navigation"]'),
      ...document.querySelectorAll('[class*="navbar"]'),
    ];
    return candidates.slice(0, 5).map(el => ({
      tag: el.tagName,
      className: el.className,
      html: el.outerHTML.slice(0, 500)
    }));
  });

  console.log('\nBottom nav candidates:');
  console.log(JSON.stringify(bottomNav, null, 2));

  await browser.close();
})();
