import { test, expect } from '@playwright/test'

test('search flow against real backend', async ({ page }) => {
  // Go to the app (Playwright will start frontend + backend via webServer command)
  await page.goto('/')

  // Ensure the search input is present
  await expect(page.locator('#q')).toBeVisible()

  // Type at least two characters to trigger a GraphQL search request
  await page.fill('#q', 'te')

  // Wait for GraphQL POST to complete and assert we got a 200 from the real API
  const graphqlResponse = await page.waitForResponse(
    (resp) => resp.url().endsWith('/graphql') && resp.request().method() === 'POST'
  )
  expect(graphqlResponse.status()).toBe(200)

  // If the backend has data, results will be rendered; otherwise verify at least the results list exists
  const resultsList = page.locator('.search-results-list')
  await expect(resultsList).toBeVisible()
})
