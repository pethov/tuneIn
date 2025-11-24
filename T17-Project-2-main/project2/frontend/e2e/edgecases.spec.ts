import { test, expect } from '@playwright/test'

test.describe('edge cases', () => {
  test('short search term should not trigger searchTracks GraphQL request', async ({ page }) => {
    await page.goto('/')

    // Intercept GraphQL and detect if a searchTracks request is made
    let searchCalled = false
    await page.route('**/graphql', (route, request) => {
      const postData = request.postData()
      let post: any = {}
      if (postData) {
        try {
          post = JSON.parse(postData)
        } catch {
          post = {}
        }
      }
      const q = typeof post?.query === 'string' ? post.query : (post?.operationName ?? '')
      if (q.includes('searchTracks') || q.includes('SearchTracks')) searchCalled = true
      route.continue()
    })

    await page.fill('#q', 'a') // 1 char only
    // short wait for debounce window
    await page.waitForTimeout(500)
    expect(searchCalled).toBe(false)
  })

  test('network error on search is handled gracefully', async ({ page }) => {
    await page.route('**/graphql', async (route, request) => {
      let post: any = {}
      const postData = request.postData()
      if (postData) {
        try {
          post = JSON.parse(postData)
        } catch {
          post = {}
        }
      }
      const vars = post?.variables || {}
      if (vars.term === 'fail') {
        await route.fulfill({ status: 500, body: 'Server error' })
        return
      }
      // otherwise return an empty result set
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { searchTracks: { total: 0, items: [] } } }),
      })
    })

    await page.goto('/')
    await page.fill('#q', 'fail')

    // wait for the failing request and assert it returned 500
    const resp = await page.waitForResponse(
      (r) => r.url().endsWith('/graphql') && r.request().method() === 'POST'
    )
    expect(resp.status()).toBe(500)

    // UI should show an error message and no result items
    await expect(page.getByRole('alert')).toHaveText(/Feil:.*GraphQL HTTP 500/i)
    await expect(page.locator('.search-results-list li')).toHaveCount(0)
  })

  test('hard network failure (aborted request) shows a generic error', async ({ page }) => {
    await page.route('**/graphql', async (route, request) => {
      let post: any = {}
      const postData = request.postData()
      if (postData) {
        try {
          post = JSON.parse(postData)
        } catch {
          post = {}
        }
      }
      const vars = post?.variables || {}
      const q = typeof post?.query === 'string' ? post.query : (post?.operationName ?? '')

      // For search requests with the special term, simulate a low-level network failure
      if ((q.includes('searchTracks') || q.includes('SearchTracks')) && vars.term === 'netfail') {
        await route.abort('failed')
        return
      }

      // For all other GraphQL requests, return an empty search result so the page can render
      if (q.includes('searchTracks') || q.includes('SearchTracks')) {
        await route.fulfill({
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ data: { searchTracks: { total: 0, items: [] } } }),
        })
        return
      }

      await route.continue()
    })

    await page.goto('/')
    await page.fill('#q', 'netfail')

    // The app should surface a generic error message to the user
    await expect(page.getByRole('alert')).toHaveText(/Feil:/i)
    await expect(page.locator('.search-results-list li')).toHaveCount(0)
  })
})
