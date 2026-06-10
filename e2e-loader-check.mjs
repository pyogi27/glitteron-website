// Temporary diagnostic: verify the AI-generation loading overlay appears.
// Run: node e2e-loader-check.mjs   (then delete this file)
import { chromium } from 'playwright'

const BASE = 'http://localhost:3001'
const TINY_PNG =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })

// Mock the generate API with a 8s delay so we can observe the loader
await page.route('**/api/visualizer/generate', async (route) => {
  await new Promise((r) => setTimeout(r, 8000))
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ compositeImageUrl: TINY_PNG }),
  })
})

page.on('console', (m) => {
  if (m.type() === 'error') console.log('[console.error]', m.text())
})
page.on('pageerror', (e) => console.log('[pageerror]', e.message))

await page.goto(`${BASE}/room-visualizer`)

// Step 1: pick a room type
await page.getByRole('button', { name: /bedroom/i }).first().click()

// Step 2: upload a real image
const fileInput = page.locator('input[type="file"]')
await fileInput.setInputFiles('public/rooms/bedroom.jpg')

// Step 4: wait for products, select first, place it
await page.waitForSelector('text=found', { timeout: 15000 })
await page.locator('[role="button"][tabindex="0"]').first().click()
await page.getByRole('button', { name: /^Place / }).click()

// Step 5: generate
await page.getByRole('button', { name: /Generate AI Preview/i }).click()

// Give React a moment, then check the overlay
await page.waitForTimeout(1500)
const overlayVisible = await page
  .getByText('Generating AI Preview', { exact: false })
  .first()
  .isVisible()
  .catch(() => false)
const statusOverlay = await page.locator('[role="status"][aria-label="Generating AI preview"]').count()

console.log('Overlay text visible while generating:', overlayVisible)
console.log('role=status overlay nodes in DOM:', statusOverlay)
await page.screenshot({ path: 'loader-check-during.png' })

// Wait for the mocked generation to finish → step 6
await page.waitForSelector('text=Share Result', { timeout: 20000 }).catch(() => {})
await page.screenshot({ path: 'loader-check-after.png' })

await browser.close()
console.log('Done. Screenshots: loader-check-during.png / loader-check-after.png')
