import { expect, test, type Page } from '@playwright/test';

async function revealDefault(page: Page) {
  await page.goto('/');
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Michel');
  await page.getByRole('button', { name: 'Show me' }).click();
}

async function openOptions(page: Page) {
  await page.getByText('More options').click();
}

test('reveals the recommended Baybayin result after one submission', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'See your name in Baybayin.' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Your name', exact: true })).toHaveValue('');
  await expect(page.getByTestId('baybayin-result')).toHaveCount(0);

  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Michel');
  await page.getByRole('button', { name: 'Show me' }).click();

  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜒᜐ᜕ᜌᜒᜎ᜕');
  await expect(page.locator('.pronunciation-summary')).toContainText('Misyel');
  await expect(page.getByLabel('How the name became Baybayin')).toContainText('Michel');
  await expect(page.getByLabel('How the name became Baybayin')).toContainText('Misyel');
  await expect(page.getByLabel('How the name became Baybayin')).toContainText('mi · syel');
  await expect(page.getByRole('button', { name: 'Copy' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Save' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Share' })).toBeVisible();
});

test('changes pronunciation inline without leaving the result', async ({ page }) => {
  await revealDefault(page);
  await page.getByRole('button', { name: 'Change pronunciation' }).click();
  await expect(page.getByRole('radio', { name: /Misyel/ })).toHaveAttribute('aria-checked', 'true');
  await page.getByRole('radio', { name: /Mikel/ }).click();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜒᜃᜒᜎ᜕');
  await expect(page.locator('.pronunciation-summary')).toContainText('Mikel');
  await expect(page.getByRole('heading', { name: 'Michel in Baybayin' })).toBeVisible();
});

test('supports manual pronunciation and optional convention switching', async ({ page }) => {
  await revealDefault(page);
  await page.getByRole('button', { name: 'Change pronunciation' }).click();
  await page.getByLabel('Phonetic spelling').fill('mark');
  await page.getByRole('button', { name: 'Use this sound' }).click();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜍ᜕ᜃ᜕');

  await openOptions(page);
  await page.getByRole('radio', { name: /Virama/ }).click();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜍ᜔ᜃ᜔');
  await page.getByRole('radio', { name: /Traditional/ }).click();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋ');
});

test('keeps an invalid manual edit from replacing the valid result', async ({ page }) => {
  await revealDefault(page);
  await page.getByRole('button', { name: 'Change pronunciation' }).click();
  await page.getByLabel('Phonetic spelling').fill('myk');
  await page.getByRole('button', { name: 'Use this sound' }).click();
  await expect(page.getByRole('alert')).toContainText(/vowel/i);
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜒᜐ᜕ᜌᜒᜎ᜕');
});

test('explains syllables and selected characters only when requested', async ({ page }) => {
  await revealDefault(page);
  const why = page.getByText('Why is it written this way?').locator('..');
  await expect(why).not.toHaveAttribute('open');
  await page.getByText('Why is it written this way?').click();
  await expect(page.getByText(/Pantig split “Misyel”/)).toBeVisible();
  await page.getByRole('button', { name: 'Explain mi' }).click();
  await expect(page.locator('.glyph-explanation').getByText(/writes “mi”/)).toBeVisible();
  await expect(page.locator('.glyph-explanation').getByText(/shared e\/i vowel mark/)).toBeVisible();
});

test('shares the result through the device share action', async ({ page }) => {
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
  await expect(page.getByRole('status').last()).toHaveText('Shared.');
});

test('generates primary and advanced image downloads', async ({ page }) => {
  await revealDefault(page);

  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save' }).click();
  await expect((await pngDownload).suggestedFilename()).toBe('michel-baybayin-card-horizontal.png');

  await openOptions(page);
  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download SVG' }).click();
  await expect((await svgDownload).suggestedFilename()).toBe('michel-baybayin-card-horizontal.svg');

  const imageDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download styled image' }).click();
  await expect((await imageDownload).suggestedFilename()).toBe('michel-baybayin-horizontal-transparent.png');
});

test('previews the selected stacked flow and background', async ({ page }) => {
  await revealDefault(page);
  await expect(page.getByText('More options').locator('..')).not.toHaveAttribute('open');
  await openOptions(page);
  await page.getByRole('radio', { name: /Stacked/ }).click();
  await page.getByRole('radio', { name: 'Terracotta' }).click();
  await expect(page.getByTestId('glyph-preview')).toHaveClass(/flow-vertical/);
  await expect(page.getByTestId('glyph-preview')).toHaveClass(/background-terracotta/);
});

test('switches and persists the dark appearance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
});

test('keeps the mobile journey focused and free of horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'See your name in Baybayin.' })).toBeVisible();
  await expect(page.getByRole('textbox', { name: 'Your name', exact: true })).toBeVisible();
  await page.getByRole('textbox', { name: 'Your name', exact: true }).fill('Michel');
  await page.getByRole('button', { name: 'Show me' }).click();
  await expect(page.getByTestId('baybayin-result')).toBeVisible();
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
});

test('moves focus to an accessible result and preserves touch targets', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await revealDefault(page);
  await expect(page.getByRole('heading', { name: 'Michel in Baybayin' })).toBeFocused();
  await expect(page.getByTestId('baybayin-result')).toHaveAttribute(
    'aria-label',
    'Suggested modern Baybayin spelling for Michel, interpreted as Misyel',
  );
  const heights = await page.locator('.theme-picker button, .primary-result-actions button, .pronunciation-summary button')
    .evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
  expect(Math.min(...heights)).toBeGreaterThanOrEqual(44);
});

test('honors reduced motion and exposes crawlable discovery content', async ({ page, request }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/');
  const motion = await page.evaluate(() => ({
    scrollBehavior: getComputedStyle(document.documentElement).scrollBehavior,
    transitionDuration: getComputedStyle(document.querySelector('.theme-picker button')!).transitionDuration,
  }));
  expect(motion.scrollBehavior).toBe('auto');
  expect(['0.01ms', '0.00001s', '1e-05s']).toContain(motion.transitionDuration);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://pantig.apps.ogbinar.com/');
  expect((await request.get('/robots.txt')).ok()).toBe(true);
  expect((await request.get('/sitemap.xml')).ok()).toBe(true);
  const rawHtml = await (await request.get('/')).text();
  expect(rawHtml).toContain('See your name in Baybayin');
  expect(rawHtml).toContain('Change the pronunciation');
});
