import { test, expect } from '@playwright/test';

test('home page renders its heading and has no console errors', async ({ page }) => {
  const errors = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Ayush Kumar');
  expect(errors).toEqual([]);
});
