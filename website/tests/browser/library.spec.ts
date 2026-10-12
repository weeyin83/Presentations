import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('unicorn palette maintains accessible contrast and keyboard focus', async ({ page }, testInfo) => {
  test.setTimeout(60000);
  await page.goto('/');
  await expect(page.locator('.site-header')).toHaveCSS('background-color', 'rgb(151, 221, 239)');
  await expect(page.locator('.site-footer')).toHaveCSS('background-color', 'rgb(241, 234, 250)');
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', '#97ddef');
  await expect(page.locator('#year')).toHaveCSS('border-top-color', 'rgb(146, 127, 228)');
  await page.keyboard.press('Tab');
  const skipLink = page.getByRole('link', { name: 'Skip to content' });
  await expect(skipLink).toBeFocused();
  await expect(skipLink).toHaveCSS('outline-width', '3px');
  await expect(skipLink).toHaveCSS('outline-color', 'rgb(98, 68, 162)');
  await skipLink.evaluate((link) => (link as HTMLElement).blur());
  await page.screenshot({ path: testInfo.outputPath('unicorn-library.png'), fullPage: false });
  const search = page.getByLabel('Search presentations', { exact: true });
  await search.fill('no-such-talk-for-palette-test');
  const reset = page.locator('#empty-state').getByRole('button', { name: 'Clear filters' });
  await expect(reset).toBeVisible();
  await reset.hover();
  await expect(reset).toHaveCSS('background-color', 'rgb(241, 234, 250)');
  expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
  for (const route of ['/', '/?topic=Terraform', '/events/', '/archive/', '/presentations/2024-kustoquerylanguage/']) {
    await page.goto(route);
    expect((await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
  await page.screenshot({ path: testInfo.outputPath('unicorn-detail.png'), fullPage: false });
});

test('talk cards use topic-specific icons and locally loaded logos', async ({ page }, testInfo) => {
  await page.goto('/');
  for (const id of ['2022-gettingstartedwithoctopus', '2022-bicepoctopus', '2022-githubactionsoctopusdeploy']) {
    const logo = page.locator(`.presentation-card[data-id="${id}"] .topic-icon img`);
    await expect(logo).toHaveAttribute('src', '/archive/images/octopusdeploy.svg');
    await logo.scrollIntoViewIfNeeded();
    await expect.poll(() => logo.evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  }
  for (const id of ['2025-practicalai', '2025-sustainabilityai']) {
    await expect(page.locator(`.presentation-card[data-id="${id}"] .topic-icon .lucide-brain`)).toHaveCount(1);
  }
  for (const id of ['2023-costsavings', '2023-costmanagement', '2018-mscug-manchester-july']) {
    await expect(page.locator(`.presentation-card[data-id="${id}"] .topic-icon .lucide-banknote`)).toHaveCount(1);
  }
  await expect(page.locator('.presentation-card[data-id="2022-learngit"] .topic-icon .lucide-git-branch')).toHaveCount(1);
  await expect(page.locator('.presentation-card[data-id="2023-techmeetup-glasgow"] .topic-icon .lucide-code')).toHaveCount(1);
  await expect(page.locator('.presentation-card[data-id="2026-sqlazurearc"] .topic-icon img')).toHaveAttribute('src', '/archive/images/arc.png');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.screenshot({ path: testInfo.outputPath('topic-icons.png'), fullPage: true });
});

test('search, empty state, reset and shareable filters', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.presentation-card:visible')).toHaveCount(48);
  await page.getByLabel('Search presentations', { exact: true }).fill('quota');
  await expect(page.locator('.presentation-card:visible')).toHaveCount(1);
  await expect(page).toHaveURL(/q=quota/);
  await page.getByLabel('Search presentations', { exact: true }).fill('no-such-talk');
  await expect(page.getByRole('heading', { name: 'No presentations found' })).toBeVisible();
  await page.locator('#empty-state').getByRole('button', { name: 'Clear filters' }).click();
  await expect(page.locator('.presentation-card:visible')).toHaveCount(48);
  await page.getByLabel('Year', { exact: true }).selectOption('2026');
  await expect(page.locator('.presentation-card:visible')).toHaveCount(2);
  await page.reload();
  await expect(page.locator('.presentation-card:visible')).toHaveCount(2);
});

test('topics, events and sort controls work together', async ({ page }) => {
  await page.goto('/?topic=Azure%20Arc&year=2026');
  await expect(page.locator('.presentation-card:visible')).toHaveCount(1);
  await expect(page.locator('.presentation-card:visible')).toContainText('SQL Server');
  await page.goto('/?event=Tech%20Meetup%20in%20Glasgow');
  await expect(page.locator('.presentation-card:visible')).toHaveCount(1);
  await page.goto('/');
  await page.getByLabel('Sort', { exact: true }).selectOption('oldest');
  await expect(page.locator('.presentation-card:visible').first().locator('.card-year')).toHaveText('2018');
});

test('detail pages expose only real downloads and include supporting code', async ({ page }) => {
  await page.goto('/presentations/2026-azurequotas/');
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Azure Quotas explained');
  await expect(page.locator('.download-panel')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'Azure Quotas Overview', exact: true })).toBeVisible();
  await page.goto('/presentations/2024-kustoquerylanguage/');
  await expect(page.getByRole('link', { name: /Download PDF/ })).toHaveAttribute('href', /raw\.githubusercontent\.com.*\.pdf$/);
  await expect(page.locator('.prose pre').first()).toContainText('getschema');
  await page.goto('/presentations/2022-bicepoctopus/');
  await expect(page.locator('.prose pre').first()).toContainText('az bicep build');
  await expect(page.getByRole('heading', { name: 'Related presentations' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Code & demos' })).toBeVisible();
});

test('keyboard access, accessible library and responsive image assets', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to content' })).toBeFocused();
  await expect(page.locator('.presentation-card:visible')).toHaveCount(48);
  const violations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
  expect(violations).toEqual([]);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  expect(await page.locator('.presentation-card img').first().evaluate((image) => (image as HTMLImageElement).complete && (image as HTMLImageElement).naturalWidth > 0)).toBe(true);
  await page.getByRole('link', { name: 'Skip to content' }).evaluate((link) => (link as HTMLElement).blur());
  await page.screenshot({ path: testInfo.outputPath('library.png'), fullPage: false });
  await page.goto('/presentations/2024-kustoquerylanguage/');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  const detailViolations = (await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa']).analyze()).violations;
  expect(detailViolations).toEqual([]);
  await page.screenshot({ path: testInfo.outputPath('presentation.png'), fullPage: false });
  expect(errors).toEqual([]);
});

test('library and direct detail links work without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  await page.goto(`${baseURL}/`);
  await expect(page.locator('.presentation-card')).toHaveCount(48);
  await page.getByRole('link', { name: 'Azure Quotas explained', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Azure Quotas explained', exact: true })).toBeVisible();
  await context.close();
});