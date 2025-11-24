import { test, expect } from '@playwright/test'

test('player state and sort selection persist after refresh (mocked)', async ({ page }) => {
  // Prepare mocked GraphQL responses: search returns Song X
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
                  trackId: 'tx-1',
                  trackName: 'Song X',
                  artistName: 'Artist X',
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

    // Return empty playlists by default
    if (query.includes('GetPlaylists') || query.includes('playlists')) {
      await route.fulfill({
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data: { playlists: [] } }),
      })
      return
    }

    // passthrough other requests
    await route.continue()
  })

  // Set sessionStorage sort keys to 'Newest' before loading the page so the UI
  // initializes with the desired selection.
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem('songsearch:sortBy', JSON.stringify('RELEASEDATE'))
      sessionStorage.setItem('songsearch:sortDirection', JSON.stringify('DESC'))
    } catch {
      // ignore storage access failures in test environment
    }
  })

  // Visit the app
  await page.goto('/')

  // Ensure SortMenu reflects 'Newest first' selection
  const sortSelect = page.locator('#sortSelect')
  await expect(sortSelect).toHaveValue('RELEASEDATE_DESC')

  // Search for Song X
  await page.fill('#q', 'Song X')
  await expect(page.locator('text=Song X')).toBeVisible()

  // Click Play on the first result
  const playBtn = page.locator('.track-row').locator('button[aria-label^="Play"]')
  await playBtn.first().click()

  // NowPlaying should show Song X (check inside the Now Playing region to avoid ambiguous matches)
  const nowPlaying = page.getByRole('region', { name: 'Now Playing' })
  await expect(nowPlaying.getByText('Song X')).toBeVisible()

  // Reload the page to simulate a refresh (storage should persist)
  await page.reload()

  // After reload, NowPlaying should still show Song X
  await expect(page.getByRole('region', { name: 'Now Playing' }).getByText('Song X')).toBeVisible()

  // And the sort select should still be set to 'Newest'
  await expect(page.locator('#sortSelect')).toHaveValue('RELEASEDATE_DESC')
})
