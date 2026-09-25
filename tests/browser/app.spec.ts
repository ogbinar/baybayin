import { expect, test } from '@playwright/test';

test('shows and explains the default Michel result', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your name, written by sound.' })).toBeVisible();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜒᜐ᜕ᜌᜒᜎ᜕');
  await expect(page.getByLabel('Detected syllables')).toContainText('mi');
  await expect(page.getByRole('heading', { name: 'How each pantig was written' })).toBeVisible();
  await expect(page.getByText('Based on the bigkas you chose. Other spellings may also be valid.')).toBeVisible();
});

test('lets the user choose the Mikel interpretation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Mikel/ }).click();
  await expect(page.getByLabel('Phonetic spelling')).toHaveValue('mikel');
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜒᜃᜒᜎ᜕');
});

test('supports manual pronunciation and convention switching', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Phonetic spelling').fill('mark');
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜍ᜕ᜃ᜕');
  await page.getByRole('radio', { name: /Virama/ }).click();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋᜍ᜔ᜃ᜔');
  await page.getByRole('radio', { name: /Traditional/ }).click();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜋ');
});

test('generates portable SVG and PNG downloads', async ({ page }) => {
  await page.goto('/');

  const svgDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'SVG' }).click();
  await expect((await svgDownload).suggestedFilename()).toBe('michel-baybayin-card-horizontal.svg');

  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download card' }).click();
  await expect((await pngDownload).suggestedFilename()).toBe('michel-baybayin-card-horizontal.png');

  const imageDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download image' }).click();
  await expect((await imageDownload).suggestedFilename()).toBe(
    'michel-baybayin-horizontal-transparent.png',
  );
});

test('exports the selected vertical flow and background', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Stacked/ }).click();
  await page.getByRole('radio', { name: 'Terracotta' }).click();
  await expect(page.getByTestId('glyph-preview')).toHaveClass(/flow-vertical/);
  await expect(page.getByTestId('glyph-preview')).toHaveClass(/background-terracotta/);

  const imageDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download image' }).click();
  await expect((await imageDownload).suggestedFilename()).toBe(
    'michel-baybayin-vertical-terracotta.png',
  );
});

test('switches and persists the dark appearance', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.getByRole('radio', { name: 'Dark' })).toHaveAttribute('aria-checked', 'true');
});

test('stays within the mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');
  const dimensions = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByTestId('baybayin-result')).toBeVisible();
  const resultTop = await page.locator('.result-panel').evaluate((element) => element.getBoundingClientRect().top);
  const controlsTop = await page.locator('.control-panel').evaluate((element) => element.getBoundingClientRect().top);
  expect(resultTop).toBeLessThan(controlsTop);
});
