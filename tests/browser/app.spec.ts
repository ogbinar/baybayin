import { expect, test } from '@playwright/test';

test('shows and explains the default Angelica result', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Your name, written by sound.' })).toBeVisible();
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜀᜈ᜕ᜇᜒᜌᜒᜎᜒᜃ');
  await expect(page.getByLabel('Detected syllables')).toContainText('an');
  await expect(page.getByRole('heading', { name: 'How this form was built' })).toBeVisible();
});

test('lets the user choose the Anghelika interpretation', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('radio', { name: /Anghelika/ }).click();
  await expect(page.getByLabel('Phonetic spelling')).toHaveValue('anghelika');
  await expect(page.getByTestId('baybayin-result')).toHaveText('ᜀᜅ᜕ᜑᜒᜎᜒᜃ');
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
  await expect((await svgDownload).suggestedFilename()).toBe('angelica-baybayin-card.svg');

  const pngDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download card' }).click();
  await expect((await pngDownload).suggestedFilename()).toBe('angelica-baybayin-card.png');

  const transparentDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Transparent PNG' }).click();
  await expect((await transparentDownload).suggestedFilename()).toBe(
    'angelica-baybayin-transparent.png',
  );
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
});
