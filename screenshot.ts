import { chromium } from 'playwright';
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('https://maker.makecode.com/?ignorecache=1');
  await page.waitForTimeout(5000);

  // Try finding and clicking "New Project"
  await page.click('.ui.card.newprojectcard', { force: true });
  await page.waitForTimeout(2000);

  await page.fill('input[placeholder="Project Name"]', 'TestProject');
  await page.click('button:has-text("Create")');
  await page.waitForTimeout(5000);
  await page.screenshot({ path: 'board_selection.png' });

  // Try to click Raspberry Pi Pico by its image/title
  // It usually has a title or something.
  await page.click('div[title="Raspberry Pi Pico"]', { force: true });
  await page.waitForTimeout(10000);
  await page.screenshot({ path: 'editor_loaded.png' });

  await browser.close();
})();
