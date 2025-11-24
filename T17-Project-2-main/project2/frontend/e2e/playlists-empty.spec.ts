import { test, expect } from '@playwright/test'

test('shows empty playlists message when none exist', async ({ page }) => {
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
    const query = typeof post?.query === 'string' ? post.query : (post?.operationName ?? '')

    if (query.includes('GetPlaylists') || query.includes('playlists')) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { playlists: [] } }),
      })
      return
    }

    if (query.includes('SearchTracks') || query.includes('searchTracks')) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: {
            searchTracks: {
              total: 1,
              items: [
                {
                  trackId: 't-e-1',
                  trackName: 'Edge Track',
                  artistName: 'Edge Artist',
                  artworkUrl100: '',
                  previewUrl: '',
                  genre: '',
                  releasedate: '',
                },
              ],
            },
          },
        }),
      })
      return
    }

    await route.continue()
  })

  await page.goto('/')
  await page.fill('#q', 'ed')

  // Open the add dropdown for the item
  await expect(page.locator('text=Edge Track')).toBeVisible()
  const addBtn = page.locator('.track-row').locator('button[aria-label^="Add"]')
  await addBtn.first().click()

  // Since playlists list is empty, the dropdown should show the empty message
  const emptyEl = page.locator('.songsearch-dropdown-empty')
  await expect(emptyEl).toBeVisible()
  await expect(emptyEl).toHaveText(/no playlists found/i)
})
