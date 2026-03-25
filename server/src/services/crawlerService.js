/**
 * Crawler Service - Playwright-based website crawler
 * Discovers pages, captures screenshots, extracts DOM snapshots.
 */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const SCREENSHOTS_DIR = path.join(__dirname, '..', '..', 'data', 'screenshots');

/**
 * Crawl a website starting from the given URL.
 * @param {string} startUrl - The URL to begin crawling
 * @param {number} maxPages - Maximum number of pages to crawl
 * @param {Function} onProgress - Callback for progress updates
 * @returns {Promise<Array>} Crawled page data
 */
async function crawlWebsite(startUrl, maxPages = 20, onProgress = () => {}) {
  const visited = new Set();
  const queue = [startUrl];
  const pages = [];
  const baseUrl = new URL(startUrl);

  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
      userAgent: 'AIAgent-BA Crawler/1.0'
    });

    while (queue.length > 0 && pages.length < maxPages) {
      const url = queue.shift();
      const normalizedUrl = normalizeUrl(url);

      if (visited.has(normalizedUrl)) continue;
      visited.add(normalizedUrl);

      try {
        const page = await context.newPage();
        await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
        await page.waitForTimeout(1000);

        const title = await page.title();
        const screenshotName = `page_${pages.length + 1}_${Date.now()}.png`;
        const screenshotPath = path.join(SCREENSHOTS_DIR, screenshotName);

        await page.screenshot({ path: screenshotPath, fullPage: true });

        // Extract DOM snapshot
        const domSnapshot = await page.evaluate(() => {
          const getElements = (selector, type) =>
            [...document.querySelectorAll(selector)].map(el => ({
              type,
              tag: el.tagName.toLowerCase(),
              text: (el.textContent || '').trim().slice(0, 200),
              id: el.id || null,
              className: el.className || null,
              href: el.href || null,
              placeholder: el.placeholder || null,
              role: el.getAttribute('role') || null,
              ariaLabel: el.getAttribute('aria-label') || null
            }));

          return {
            buttons: getElements('button, [role="button"], input[type="submit"]', 'button'),
            inputs: getElements('input:not([type="hidden"]), textarea, select', 'input'),
            links: getElements('a[href]', 'link'),
            forms: getElements('form', 'form'),
            headings: getElements('h1, h2, h3, h4, h5, h6', 'heading'),
            images: getElements('img', 'image'),
            modals: getElements('[role="dialog"], .modal, [class*="modal"]', 'modal'),
            navs: getElements('nav, [role="navigation"]', 'navigation')
          };
        });

        // Discover internal links
        const links = await page.evaluate((baseOrigin) => {
          return [...document.querySelectorAll('a[href]')]
            .map(a => a.href)
            .filter(href => {
              try {
                const u = new URL(href);
                return u.origin === baseOrigin && !href.includes('#') && !href.match(/\.(pdf|zip|png|jpg|gif|svg|css|js)$/i);
              } catch { return false; }
            });
        }, baseUrl.origin);

        const uniqueLinks = [...new Set(links.map(normalizeUrl))];
        uniqueLinks.forEach(link => {
          if (!visited.has(link)) queue.push(link);
        });

        const pageData = {
          url: normalizedUrl,
          title,
          screenshotPath: `/screenshots/${screenshotName}`,
          domSnapshot,
          links: uniqueLinks,
          crawledAt: new Date().toISOString()
        };

        pages.push(pageData);
        onProgress({
          crawled: pages.length,
          queued: queue.length,
          total: Math.min(pages.length + queue.length, maxPages),
          currentUrl: normalizedUrl
        });

        await page.close();
      } catch (err) {
        console.error(`Failed to crawl ${url}:`, err.message);
        onProgress({ error: `Failed: ${url} - ${err.message}` });
      }
    }

    await context.close();
  } catch (err) {
    console.error('Browser launch failed:', err.message);
    throw err;
  } finally {
    if (browser) await browser.close();
  }

  return pages;
}

/**
 * Normalize a URL by removing trailing slashes, fragments, and sorting query params.
 * @param {string} url - URL to normalize
 * @returns {string} Normalized URL
 */
function normalizeUrl(url) {
  try {
    const u = new URL(url);
    u.hash = '';
    let pathname = u.pathname.replace(/\/+$/, '') || '/';
    return `${u.origin}${pathname}${u.search}`;
  } catch {
    return url;
  }
}

module.exports = { crawlWebsite };
