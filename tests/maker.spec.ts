import { test, expect } from '@playwright/test';

test('maker load extension in maker.makecode.com and verify blocks', async ({ page }) => {
    test.setTimeout(300000); // 5 minutes

    console.log("Navigating to maker.makecode.com...");
    // Force RP2040 and bypass some tutorials/popups if possible
    await page.goto('https://maker.makecode.com/?forceRP2040=1&nosandbox=1', { waitUntil: 'networkidle' });

    // Click "New Project"
    console.log("Clicking New Project...");
    const newProjectCard = page.locator('.newprojectcard, #newproject, .ui.card.clickable').filter({ hasText: /New Project/i }).first();
    await expect(newProjectCard).toBeVisible({ timeout: 30000 });
    await page.evaluate((el) => (el as HTMLElement).click(), await newProjectCard.elementHandle());

    // Wait for the project name input
    console.log("Entering project name...");
    const nameInput = page.locator('div.modal input[type="text"]').first();
    await expect(nameInput).toBeVisible({ timeout: 15000 });
    await nameInput.fill('Test WS2812B');

    const createButton = page.locator('div.modal button.positive, div.modal button:has-text("Create")').first();
    await createButton.click();

    // Board Selection - Raspberry Pi Pico (if it appears)
    console.log("Checking for Raspberry Pi Pico board selection...");
    try {
        // Wait a bit for board selection to appear
        const picoBoard = page.locator('.ui.card, .card').filter({ hasText: /Raspberry Pi Pico/i }).first();
        if (await picoBoard.isVisible({ timeout: 15000 })) {
            await picoBoard.click();
            console.log("Selected Raspberry Pi Pico");
        }
    } catch (e) {
        console.log("Board selection skipped or handled.");
    }

    // Wait for the editor to load
    console.log("Waiting for editor...");
    const blocklyTree = page.locator('.blocklyTreeRoot').first();
    await expect(blocklyTree).toBeVisible({ timeout: 90000 });

    // Open Extensions
    console.log("Opening Extensions...");
    const extensionsButton = page.locator('.blocklyTreeRow').filter({ hasText: /Extensions/i }).first();
    await expect(extensionsButton).toBeVisible({ timeout: 30000 });
    await extensionsButton.click();

    // Import extension
    console.log("Importing extension...");
    const searchInput = page.locator('input[type="text"]').filter({ state: 'visible' }).first();
    await expect(searchInput).toBeVisible();
    // Use the current repository URL if provided, otherwise default to the repo
    const extensionUrl = process.env.EXTENSION_URL || 'https://github.com/chatelao/pxt-ws2812b';
    console.log(`Using extension URL: ${extensionUrl}`);
    await searchInput.fill(extensionUrl);
    await page.keyboard.press('Enter');

    // Wait for results and click the extension card
    console.log("Waiting for extension card...");
    const extensionTitle = page.getByText('ws2812b').first();
    await expect(extensionTitle).toBeVisible({ timeout: 60000 });
    await extensionTitle.click();

    // Wait for extension to load (it shows a loading overlay)
    console.log("Waiting for extension to finish loading...");
    await page.waitForTimeout(5000); // Give it some time to start loading

    // Wait for the toolbox to update. We expect "WS2812B" or at least "LIGHT"
    console.log("Waiting for WS2812B or LIGHT category...");
    const wsCategory = page.locator('.blocklyTreeRow').filter({ hasText: /WS2812B|LIGHT/i }).first();
    await expect(wsCategory).toBeVisible({ timeout: 90000 });

    // Click it to show blocks
    await wsCategory.click();
    await page.waitForTimeout(2000);

    // Assertion: verify blocklyFlyout is visible after clicking the category
    const blocklyFlyout = page.locator('.blocklyFlyout');
    await expect(blocklyFlyout).toBeVisible();

    await page.screenshot({ path: 'test-results/extension-blocks.png' });
    console.log("Screenshot of blocks saved.");

    // Switch to JavaScript
    console.log("Switching to JavaScript...");
    const jsButton = page.locator('a, div').filter({ hasText: /^JavaScript$/ }).first();
    await jsButton.click();

    // Handle "Problem converting" dialog if it appears
    try {
        const doneButton = page.locator('button').filter({ hasText: /Done|Discard|Stay/i }).first();
        if (await doneButton.isVisible({ timeout: 10000 })) {
            console.log("Handling conversion dialog...");
            await doneButton.click();
        }
    } catch (e) {}

    console.log("Waiting for Monaco...");
    const monacoEditor = page.locator('div[role="code"].monaco-editor');
    await expect(monacoEditor).toBeVisible({ timeout: 60000 });

    // Inject code
    const code = `
let strip = ws2812b.create(0, 10);
strip.setBuffer(hex\`ff0000 00ff00 0000ff\`);
strip.show();
`;

    console.log("Injecting code...");
    await page.click('.monaco-editor');
    await page.keyboard.press('Control+A');
    await page.keyboard.press('Backspace');
    // Slow down typing to avoid issues
    await page.keyboard.type(code, { delay: 50 });

    // Wait for compilation/background work
    console.log("Waiting for compilation...");
    await page.waitForTimeout(10000);


    // Switch to Python
    console.log("Switching to Python...");
    // In Maker, the Python option might be hidden in a dropdown next to JavaScript
    try {
        const pythonButton = page.locator('.python-menuitem, [aria-label="Convert code to Python"]').first();
        await page.evaluate((el) => {
            if (el) (el as HTMLElement).click();
            else {
                // Try to find it by text if selector fails
                const items = Array.from(document.querySelectorAll('.item'));
                const pythonItem = items.find(item => item.textContent?.trim() === 'Python') as HTMLElement;
                if (pythonItem) pythonItem.click();
            }
        }, await pythonButton.elementHandle().catch(() => null));
    } catch (e) {
        console.log("Python switch failed, trying alternative...");
        await page.click('.dropdown.icon');
        await page.click('text=Python');
    }

    // Wait for Python editor
    console.log("Waiting for Python editor...");
    await expect(monacoEditor).toBeVisible({ timeout: 60000 });
    await page.waitForTimeout(5000); // Wait for conversion

    // Verify Python code contains expected terms
    const pythonCode = await page.evaluate(() => {
        const editor = document.querySelector('.monaco-editor[data-uri^="pkg:"]') as any;
        if (editor && editor.innerText) return editor.innerText;
        // Fallback to finding the model value via monaco API if available
        // @ts-ignore
        if (window.monaco && window.monaco.editor) {
            // @ts-ignore
            const models = window.monaco.editor.getModels();
            const pythonModel = models.find(m => m.uri.path.endsWith('.py'));
            if (pythonModel) return pythonModel.getValue();
        }
        return document.body.innerText; // extreme fallback
    });
    console.log("Python code snippet:");
    console.log(pythonCode.substring(0, 200));

    expect(pythonCode).toContain('ws2812b.create');
    expect(pythonCode).toContain('strip.show');

    await page.screenshot({ path: 'test-results/python-view.png' });
    console.log("Python view screenshot saved.");

    // Switch back to Blocks for final download
    console.log("Switching back to Blocks for download...");
    const blocksButton = page.locator('a, div').filter({ hasText: /^Blocks$/ }).first();
    await blocksButton.click();
    await page.waitForTimeout(2000);

    // Download firmware
    console.log("Downloading firmware...");
    const downloadPromise = page.waitForEvent('download');
    const downloadButton = page.locator('.download-button').first();
    await expect(downloadButton).toBeVisible({ timeout: 30000 });
    await downloadButton.click();

    const download = await downloadPromise;
    const downloadPath = 'test-results/firmware.uf2';
    await download.saveAs(downloadPath);
    console.log(`Firmware downloaded to ${downloadPath}`);

    // Attach firmware to test report
    test.info().attachments.push({
        name: 'firmware',
        path: downloadPath,
        contentType: 'application/octet-stream'
    });

    console.log("Test passed!");
});
