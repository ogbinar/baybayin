import { expect, test, type Page } from '@playwright/test';

async function openPronunciation(page: Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Show me' }).click();
}

async function revealDefault(page: Page) {
  await openPronunciation(page);
  await page.getByRole('button', { name: /Misyel/ }).click();
}

async function openOptions(page: Page) {
  await page.getByText('Writing and image options').click();
}

test('guides the user from name to pronunciation to reveal', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your name, written by sound.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What’s your name?' })).toBeVisible();
  await expect(page.getByTestId('baybayin-result')).toHaveCount(0);

  await page.getByRole('button', { name: 'Show me' }).click();
  await expect(page.getByRole('heading', { name: 'How do you say Michel?' })).toBeVisible();
  await page.getByRole('button', { name: /Misyel/ }).click();

  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜒᜐ᜕ᜌᜒᜎ᜕');
  await expect(page.getByLabel('How the name became Baybayin')).toContainText('mi · syel');
  await expect(page.getByRole('heading', { name: 'How each pantig was written' })).toBeVisible();
});

test('lets the user choose the Mikel interpretation', async ({ page }) => {
  await openPronunciation(page);
  await page.getByRole('button', { name: /Mikel/ }).click();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜒᜃᜒᜎ᜕');
});

test('supports manual pronunciation and optional convention switching', async ({ page }) => {
  await openPronunciation(page);
  await page.getByLabel('Phonetic spelling').fill('mark');
  await page.getByRole('button', { name: 'Use this sound' }).click();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜍ᜕ᜃ᜕');

  await openOptions(page);
  await page.getByRole('radio', { name: /Virama/ }).click();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜍ᜔ᜃ᜔');
  await page.getByRole('radio', { name: /Traditional/ }).click();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋ');
});

test('explains a selected Baybayin symbol', async ({ page }) => {
  await revealDefault(page);
  await page.getByRole('button', { name: 'Explain mi' }).click();
  const explanation = page.locator('.glyph-explanation');
  await expect(explanation.getByText(/writes “mi”/)).toBeVisible();
  await expect(explanation.getByText(/shared e\/i vowel mark/)).toBeVisible();
});

test('shares the revealed result through the device share action', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'canShare', { configurable: true, value: () => false });
    Object.defineProperty(navigator, 'share', {
      configurable: true,
      value: async () => {
        document.documentElement.dataset.shareCalled = 'true';
      },
    });
  });
  await revealDefault(page);
  await page.getByRole('button', { name: 'Share' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-share-called', 'true');
  await expect(page.getByRole('status')).toHaveText('Shared.');
});

test('generates primary and advanced image downloads', async ({ page }) => {
  await revealDefault(page);

  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save image' }).click();
  await expect((await pngDownload).suggestedFilename()).toBe('michel-baybayin-card-horizontal.png');

  await openOptions(page);
  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SVG' }).click();
  await expect((await svgDownload).suggestedFilename()).toBe('michel-baybayin-card-horizontal.svg');

  const imageDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download styled image' }).click();
  await expect((await imageDownload).suggestedFilename()).toBe('michel-baybayin-horizontal-transparent.png');
});

test('exports the selected stacked flow and background', async ({ page }) => {
  await revealDefault(page);
  await openOptions(page);
  await page.getByRole('radio', { name: /Stacked/ }).click();
  await page.getByRole('radio', { name: 'Terracotta' }).click();
  await expect(page.getByTestId('glyph-preview')).toHaveClass(/flow-vertical/);
  await expect(page.getByTestId('glyph-preview')).toHaveClass(/background-terracotta/);

  const imageDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download styled image' }).click();
  await expect((await imageDownload).suggestedFilename()).toBe('michel-baybayin-vertical-terracotta.png');
});

test('switches and persists the dark appearance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('keeps the name first and the reveal within the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'What’s your name?' })).toBeVisible();
  await expect(page.getByTestId('baybayin-result')).toHaveCount(0);
  await page.getByRole('button', { name: 'Show me' }).click();
  await page.getByRole('button', { name: /Misyel/ }).click();
  await expect(page.getByTestId('baybayin-result')).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test('exposes crawlable metadata and discovery files', async ({ page, request }) => {
  await page.goto('/');
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pantig.apps.ogbinar.com/');
  await expect(page.locator('meta[property="og:title"]')).toHaveAttribute('content', /Discover your name/);
  expect((await request.get('/robots.txt')).ok()).toBe(true);
  expect((await request.get('/sitemap.xml')).ok()).toBe(true);
  const rawHtml = await (await request.get('/')).text();
  expect(rawHtml).toContain('Discover your name in Baybayin');
  expect(rawHtml).toContain('How it works');
});
